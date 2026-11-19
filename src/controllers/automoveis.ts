import { Router } from "express";
import { Agentes, Automovel, Automoveis, Clientes, Pedidos } from "../models";
import { logado, soAgente } from "../middleware";
import { texto } from "../validacao";

const r = Router();

r.use("/automoveis", logado);

async function donos() {
  const [cl, ag] = await Promise.all([Clientes.list(), Agentes.list()]);

  return [
    ...cl.map((c) => ({ v: `cliente:${c._id}`, t: `Cliente — ${c.nome}` })),
    ...ag.map((a) => ({
      v: `${a.tipo}:${a._id}`,
      t: `${a.tipo === "banco" ? "Banco" : "Empresa"} — ${a.nome}`,
    })),
  ];
}
function ler(
  b: any,
  ds: { v: string }[],
): { erro?: string; dados?: Omit<Automovel, "_id"> } {
  for (const k of [
    "marca",
    "modelo",
    "ano",
    "placa",
    "matricula",
    "proprietario",
  ])
    if (!texto(typeof b[k] === "number" ? String(b[k]) : b[k]))
      return { erro: `Campo "${k}" é obrigatório` };

  const ano = Number(b.ano);

  if (!Number.isInteger(ano) || ano < 1900 || ano > 2100)
    return { erro: "Ano inválido" };
  if (!ds.some((d) => d.v === texto(b.proprietario)))
    return { erro: "Proprietário inválido (cliente, empresa ou banco)" };

  const [t, id] = texto(b.proprietario).split(":");

  return {
    dados: {
      marca: texto(b.marca),
      modelo: texto(b.modelo),
      ano,
      placa: texto(b.placa).toUpperCase(),
      matricula: texto(b.matricula),
      proprietarioTipo: t as Automovel["proprietarioTipo"],
      proprietarioId: id,
    },
  };
}

r.get("/automoveis", async (_req, res) => {
  const nomes = Object.fromEntries((await donos()).map((d) => [d.v, d.t]));
  const lista = await Automoveis.list();

  res.json(
    lista.map((a) => ({
      ...a,
      proprietarioNome:
        nomes[`${a.proprietarioTipo}:${a.proprietarioId}`] ?? "—",
    })),
  );
});
r.get("/automoveis/donos", soAgente, async (_req, res) =>
  res.json(await donos()),
);
r.get("/automoveis/:id", soAgente, async (req, res) => {
  const a = await Automoveis.get(String(req.params.id));

  if (!a) return res.status(404).json({ erro: "Automóvel não encontrado" });
  res.json({ ...a, proprietario: `${a.proprietarioTipo}:${a.proprietarioId}` });
});
r.post("/automoveis", soAgente, async (req, res) => {
  const { erro, dados } = ler(req.body, await donos());

  if (erro || !dados) return res.status(400).json({ erro });

  const id = await Automoveis.create(dados);

  res.status(201).json({ id });
});
r.put("/automoveis/:id", soAgente, async (req, res) => {
  const { erro, dados } = ler(req.body, await donos());

  if (erro || !dados) return res.status(400).json({ erro });
  if (!(await Automoveis.get(String(req.params.id))))
    return res.status(404).json({ erro: "Automóvel não encontrado" });
  await Automoveis.update(String(req.params.id), dados);
  res.json({ ok: true });
});
r.delete("/automoveis/:id", soAgente, async (req, res) => {
  const id = String(req.params.id);

  if (!(await Automoveis.get(id)))
    return res.status(404).json({ erro: "Automóvel não encontrado" });
  if ((await Pedidos.list({ automovelId: id })).length)
    return res.status(409).json({
      erro: "Não é possível excluir: há pedidos de aluguel para este automóvel",
    });
  await Automoveis.remove(id);
  res.json({ ok: true });
});

export default r;
