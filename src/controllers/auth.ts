import { Router } from "express";
import bcrypt from "bcryptjs";
import { Agentes, Clientes, Usuarios } from "../models";

const r = Router();

r.get("/me", (req, res) => res.json({ user: req.session.user ?? null }));

r.post("/login", async (req, res) => {
  const [u] = await Usuarios.list({
    email: String(req.body.email ?? "")
      .toLowerCase()
      .trim(),
  });

  if (!u || !bcrypt.compareSync(String(req.body.senha ?? ""), u.senha))
    return res.status(401).json({ erro: "Credenciais inválidas" });

  const agente = u.perfil === "agente" ? await Agentes.get(u.refId) : null;
  const p = agente ?? (await Clientes.get(u.refId));

  req.session.user = {
    id: u._id,
    perfil: u.perfil,
    refId: u.refId,
    nome: p?.nome ?? u.email,
    tipoAgente: agente?.tipo,
  };
  res.json({ user: req.session.user });
});

r.post("/logout", (req, res) =>
  req.session.destroy(() => res.json({ ok: true })),
);

export default r;
