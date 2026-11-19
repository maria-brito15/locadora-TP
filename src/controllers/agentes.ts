import { Router } from "express";
import {
  Agente,
  Agentes,
  Automoveis,
  Avaliacoes,
  Contratos,
  Pedidos,
  criarUsuario,
  emailLivre,
  removerUsuarioDe,
} from "../models";
import { logado, soAgente } from "../middleware";
import { emailValido, texto } from "../validacao";

const r = Router();

r.use("/agentes", logado, soAgente);

function ler(b: any): { erro?: string; dados?: Omit<Agente, "_id"> } {
  for (const k of ["nome", "cnpj", "endereco"])
    if (!texto(b[k])) return { erro: `Campo "${k}" é obrigatório` };
  if (!["empresa", "banco"].includes(b.tipo))
    return { erro: "Tipo deve ser empresa ou banco" };

  return {
    dados: {
      nome: texto(b.nome),
      cnpj: texto(b.cnpj),
      endereco: texto(b.endereco),
      tipo: b.tipo,
    },
  };
}

r.get("/agentes", async (_req, res) => res.json(await Agentes.list()));
r.get("/agentes/:id", async (req, res) => {
  const a = await Agentes.get(String(req.params.id));

  if (!a) return res.status(404).json({ erro: "Agente não encontrado" });
  res.json(a);
});
r.post("/agentes", async (req, res) => {
  const { erro, dados } = ler(req.body);
  const email = texto(req.body.email).toLowerCase();
  const senha = typeof req.body.senha === "string" ? req.body.senha : "";
  const e =
    erro ??
    (!emailValido(email)
      ? "E-mail inválido"
      : senha.length < 6
        ? "Senha deve ter ao menos 6 caracteres"
        : !(await emailLivre(email))
          ? "E-mail já cadastrado"
          : null);

  if (e || !dados) return res.status(400).json({ erro: e });

  const id = await Agentes.create(dados);

  await criarUsuario(email, senha, "agente", id);
  res.status(201).json({ id });
});
r.put("/agentes/:id", async (req, res) => {
  const { erro, dados } = ler(req.body);

  if (erro || !dados) return res.status(400).json({ erro });

  const id = String(req.params.id);
  const atual = await Agentes.get(id);

  if (!atual) return res.status(404).json({ erro: "Agente não encontrado" });
  if (
    atual.tipo === "banco" &&
    dados.tipo !== "banco" &&
    (await Contratos.list({ bancoId: id })).length
  )
    return res.status(409).json({
      erro: "Este banco possui contratos de crédito e não pode mudar de tipo",
    });
  await Agentes.update(id, dados);
  res.json({ ok: true });
});
r.delete("/agentes/:id", async (req, res) => {
  const id = String(req.params.id);

  if (id === req.session.user!.refId)
    return res.status(400).json({ erro: "Você não pode excluir a si mesmo" });
  if (!(await Agentes.get(id)))
    return res.status(404).json({ erro: "Agente não encontrado" });

  const [carros, avaliacoes, contratos, pedidos] = await Promise.all([
    Automoveis.list({ proprietarioId: id }),
    Avaliacoes.list({ agenteId: id }),
    Contratos.list({ bancoId: id }),
    Pedidos.list({ agenteId: id }),
  ]);

  if (carros.length || avaliacoes.length || contratos.length || pedidos.length)
    return res.status(409).json({
      erro: "Não é possível excluir: o agente possui automóveis, avaliações ou contratos vinculados",
    });
  await Agentes.remove(id);
  await removerUsuarioDe(id);
  res.json({ ok: true });
});

export default r;
