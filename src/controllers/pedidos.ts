import { Request, Router } from "express";
import {
  Agentes,
  Automoveis,
  Avaliacoes,
  Clientes,
  Contratos,
  Pedido,
  Pedidos,
} from "../models";
import { logado, soAgente, soCliente } from "../middleware";
import { texto } from "../validacao";

const r = Router();

r.use("/pedidos", logado);

async function enriquecer(ps: Pedido[]) {
  const [cl, au, ag, av, co] = await Promise.all([
    Clientes.list(),
    Automoveis.list(),
    Agentes.list(),
    Avaliacoes.list(),
    Contratos.list(),
  ]);
  const nome = (l: { _id: string; nome: string }[], id?: string) =>
    l.find((x) => x._id === id)?.nome ?? "—";

  return ps
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .map((p) => {
      const a = au.find((x) => x._id === p.automovelId);

      return {
        ...p,
        clienteNome: nome(cl, p.clienteId),
        carro: a ? `${a.marca} ${a.modelo} ${a.ano} (${a.placa})` : "—",
        avaliacoes: av
          .filter((x) => x.pedidoId === p._id)
          .map((x) => ({ ...x, agenteNome: nome(ag, x.agenteId) })),
        contrato: co.find((x) => x.pedidoId === p._id) ?? null,
      };
    });
}
function dataReal(d: string) {
  const t = new Date(d + "T00:00:00Z");

  return !isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d;
}
function validar(b: any): string | null {
  if (!texto(b.automovelId)) return "Selecione um automóvel";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(b.inicio ?? "") ||
    !/^\d{4}-\d{2}-\d{2}$/.test(b.fim ?? "")
  )
    return "Informe o período de aluguel";
  if (!dataReal(b.inicio) || !dataReal(b.fim)) return "Data inválida";
  if (b.fim < b.inicio) return "A data final deve ser posterior à inicial";

  return null;
}
async function meu(req: Request) {
  const p = await Pedidos.get(String(req.params.id));

  return p && p.clienteId === req.session.user!.refId ? p : null;
}

r.get("/pedidos", async (req, res) => {
  const u = req.session.user!;
  const filtro =
    u.perfil === "cliente"
      ? { clienteId: u.refId }
      : typeof req.query.status === "string"
        ? { status: req.query.status }
        : {};

  res.json(await enriquecer(await Pedidos.list(filtro)));
});
r.get("/pedidos/:id", async (req, res) => {
  const u = req.session.user!;
  const p = await Pedidos.get(String(req.params.id));

  if (!p) return res.status(404).json({ erro: "Pedido não encontrado" });
  if (u.perfil === "cliente" && p.clienteId !== u.refId)
    return res.status(403).json({ erro: "Acesso negado" });

  const [pedido] = await enriquecer([p]);

  res.json(pedido);
});
r.post("/pedidos", soCliente, async (req, res) => {
  const erro = validar(req.body);

  if (erro || !(await Automoveis.get(texto(req.body.automovelId))))
    return res.status(400).json({ erro: erro ?? "Automóvel inexistente" });

  const id = await Pedidos.create({
    clienteId: req.session.user!.refId,
    automovelId: texto(req.body.automovelId),
    inicio: req.body.inicio,
    fim: req.body.fim,
    criadoEm: new Date().toISOString(),
    status: "Em análise",
  });

  res.status(201).json({ id });
});
r.put("/pedidos/:id", soCliente, async (req, res) => {
  const p = await meu(req);

  if (!p) return res.status(403).json({ erro: "Acesso negado" });
  if (p.status !== "Em análise")
    return res
      .status(400)
      .json({ erro: "Só é possível editar pedidos em análise" });

  const erro = validar(req.body);

  if (erro || !(await Automoveis.get(texto(req.body.automovelId))))
    return res.status(400).json({ erro: erro ?? "Automóvel inexistente" });
  await Pedidos.update(p._id, {
    automovelId: texto(req.body.automovelId),
    inicio: req.body.inicio,
    fim: req.body.fim,
  });
  res.json({ ok: true });
});
r.post("/pedidos/:id/cancelar", soCliente, async (req, res) => {
  const p = await meu(req);

  if (!p) return res.status(403).json({ erro: "Acesso negado" });
  if (!["Em análise", "Aprovado"].includes(p.status))
    return res
      .status(400)
      .json({ erro: `Pedido "${p.status}" não pode ser cancelado` });
  await Pedidos.update(p._id, { status: "Cancelado" });
  res.json({ ok: true });
});

r.post("/pedidos/:id/avaliar", soAgente, async (req, res) => {
  const p = await Pedidos.get(String(req.params.id));
  const ag = await Agentes.get(req.session.user!.refId);

  if (!p || !ag) return res.status(404).json({ erro: "Não encontrado" });
  if (p.status !== "Em análise")
    return res.status(400).json({
      erro: "Só pedidos em análise podem ser avaliados (pedido cancelado não pode ser aprovado)",
    });

  const { parecer, observacao } = req.body;

  if (!["aprovado", "reprovado"].includes(parecer))
    return res.status(400).json({ erro: "Parecer inválido" });
  if (!texto(observacao))
    return res.status(400).json({ erro: "Informe a justificativa" });

  const valor = Number(req.body.valor || 0);
  const prazo = Number(req.body.prazo || 0);
  const comCredito = parecer === "aprovado" && valor > 0;

  if (comCredito && ag.tipo !== "banco")
    return res.status(400).json({
      erro: "Contrato de crédito só pode ser concedido por agente do tipo banco",
    });
  if (comCredito && prazo <= 0)
    return res.status(400).json({ erro: "Informe o prazo do crédito" });
  await Avaliacoes.create({
    pedidoId: p._id,
    agenteId: ag._id,
    data: new Date().toISOString(),
    parecer,
    observacao: texto(observacao),
  });
  await Pedidos.update(p._id, {
    status: parecer === "aprovado" ? "Aprovado" : "Reprovado",
    agenteId: ag._id,
  });
  if (comCredito)
    await Contratos.create({
      pedidoId: p._id,
      bancoId: ag._id,
      valor,
      prazo,
      situacao: texto(req.body.situacao) || "Concedido",
    });
  res.json({ ok: true });
});
r.post("/pedidos/:id/executar", soAgente, async (req, res) => {
  const p = await Pedidos.get(String(req.params.id));

  if (!p || p.status !== "Aprovado")
    return res
      .status(400)
      .json({ erro: "Apenas pedidos aprovados podem entrar em execução" });
  await Pedidos.update(p._id, { status: "Contrato em execução" });
  res.json({ ok: true });
});

export default r;
