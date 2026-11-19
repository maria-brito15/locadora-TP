import { Request, Router } from "express";
import {
  Automoveis,
  Avaliacoes,
  Cliente,
  Clientes,
  Contratos,
  Pedidos,
  criarUsuario,
  emailLivre,
  removerUsuarioDe,
} from "../models";
import { logado } from "../middleware";
import { emailValido, soDigitos, texto } from "../validacao";

const r = Router();

function ler(b: any): { erro?: string; dados?: Omit<Cliente, "_id"> } {
  for (const k of ["nome", "cpf", "rg", "endereco", "profissao"])
    if (!texto(b[k])) return { erro: `Campo "${k}" é obrigatório` };
  if (soDigitos(texto(b.cpf)).length !== 11)
    return { erro: "CPF deve ter 11 dígitos" };

  const lista = Array.isArray(b.empregos) ? b.empregos : [];
  const empregos = lista
    .map((e: any) => ({
      entidade: texto(e?.entidade),
      rendimento: Number(e?.rendimento || 0),
    }))
    .filter((e: { entidade: string }) => e.entidade);

  if (empregos.length > 3)
    return { erro: "Um cliente pode ter no máximo 3 vínculos empregatícios" };
  if (empregos.some((e: any) => isNaN(e.rendimento) || e.rendimento < 0))
    return { erro: "Rendimento inválido" };

  return {
    dados: {
      nome: texto(b.nome),
      cpf: texto(b.cpf),
      rg: texto(b.rg),
      endereco: texto(b.endereco),
      profissao: texto(b.profissao),
      empregos,
    },
  };
}
async function cpfLivre(cpf: string, exceto?: string) {
  const alvo = soDigitos(cpf);

  return !(await Clientes.list()).some(
    (c) => c._id !== exceto && soDigitos(c.cpf) === alvo,
  );
}
const dono = (req: Request, id: string) =>
  req.session.user?.perfil === "cliente" && req.session.user.refId === id;

r.post("/registro", async (req, res) => {
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
          : !(await cpfLivre(dados!.cpf))
            ? "CPF já cadastrado"
            : null);

  if (e || !dados) return res.status(400).json({ erro: e });

  const id = await Clientes.create(dados);

  await criarUsuario(email, senha, "cliente", id);
  res.status(201).json({ id });
});

r.get("/clientes", logado, async (req, res) => {
  const u = req.session.user!;
  const clientes =
    u.perfil === "agente"
      ? await Clientes.list()
      : ([await Clientes.get(u.refId)].filter(Boolean) as Cliente[]);

  res.json(clientes);
});
r.get("/clientes/:id", logado, async (req, res) => {
  const id = String(req.params.id);
  const c = await Clientes.get(id);

  if (!c || !dono(req, id))
    return res.status(403).json({ erro: "Acesso negado" });
  res.json(c);
});
r.put("/clientes/:id", logado, async (req, res) => {
  const id = String(req.params.id);

  if (!dono(req, id)) return res.status(403).json({ erro: "Acesso negado" });

  const { erro, dados } = ler(req.body);

  if (erro || !dados) return res.status(400).json({ erro });
  if (!(await cpfLivre(dados.cpf, id)))
    return res.status(400).json({ erro: "CPF já cadastrado" });
  await Clientes.update(id, dados);
  req.session.user!.nome = dados.nome;
  res.json({ ok: true });
});
r.delete("/clientes/:id", logado, async (req, res) => {
  const id = String(req.params.id);

  if (!dono(req, id)) return res.status(403).json({ erro: "Acesso negado" });
  if ((await Automoveis.list({ proprietarioId: id })).length)
    return res.status(409).json({
      erro: "Não é possível excluir: o cliente é proprietário de automóveis",
    });
  for (const p of await Pedidos.list({ clienteId: id })) {
    for (const a of await Avaliacoes.list({ pedidoId: p._id }))
      await Avaliacoes.remove(a._id);

    for (const c of await Contratos.list({ pedidoId: p._id }))
      await Contratos.remove(c._id);
    await Pedidos.remove(p._id);
  }
  await Clientes.remove(id);
  await removerUsuarioDe(id);
  req.session.destroy(() => res.json({ ok: true }));
});

export default r;
