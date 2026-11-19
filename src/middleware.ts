import { ErrorRequestHandler, RequestHandler } from "express";
import { Perfil, TipoAgente } from "./models";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      perfil: Perfil;
      refId: string;
      nome: string;
      tipoAgente?: TipoAgente;
    };
  }
}

export const logado: RequestHandler = (req, res, next) => {
  if (req.session.user) return next();
  res.status(401).json({ erro: "Faça login para continuar" });
};

export const soAgente: RequestHandler = (req, res, next) => {
  if (req.session.user?.perfil === "agente") return next();
  res.status(403).json({ erro: "Acesso negado: apenas agentes" });
};

export const soCliente: RequestHandler = (req, res, next) => {
  if (req.session.user?.perfil === "cliente") return next();
  res.status(403).json({ erro: "Acesso negado: apenas clientes" });
};

export const erroGeral: ErrorRequestHandler = (e, _req, res, _next) => {
  console.error(e);
  res.status(500).json({ erro: "Erro interno do servidor" });
};
