import bcrypt from "bcryptjs";
import { col } from "./restheart";

export type Perfil = "cliente" | "agente";
export type TipoAgente = "empresa" | "banco";
export type Status =
  | "Em análise"
  | "Aprovado"
  | "Reprovado"
  | "Cancelado"
  | "Contrato em execução";

export interface Usuario {
  _id: string;
  email: string;
  senha: string;
  perfil: Perfil;
  refId: string;
}
export interface Emprego {
  entidade: string;
  rendimento: number;
}
export interface Cliente {
  _id: string;
  nome: string;
  cpf: string;
  rg: string;
  endereco: string;
  profissao: string;
  empregos: Emprego[];
}
export interface Agente {
  _id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  tipo: TipoAgente;
}
export interface Automovel {
  _id: string;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  matricula: string;
  proprietarioTipo: "cliente" | "empresa" | "banco";
  proprietarioId: string;
}
export interface Pedido {
  _id: string;
  clienteId: string;
  automovelId: string;
  inicio: string;
  fim: string;
  criadoEm: string;
  status: Status;
  agenteId?: string;
}
export interface Avaliacao {
  _id: string;
  pedidoId: string;
  agenteId: string;
  data: string;
  parecer: "aprovado" | "reprovado";
  observacao: string;
}
export interface Contrato {
  _id: string;
  pedidoId: string;
  bancoId: string;
  valor: number;
  prazo: number;
  situacao: string;
}

export const Usuarios = col<Usuario>("usuarios");
export const Clientes = col<Cliente>("clientes");
export const Agentes = col<Agente>("agentes");
export const Automoveis = col<Automovel>("automoveis");
export const Pedidos = col<Pedido>("pedidos");
export const Avaliacoes = col<Avaliacao>("avaliacoes");
export const Contratos = col<Contrato>("contratos");

export async function emailLivre(email: string) {
  return (await Usuarios.list({ email })).length === 0;
}
export async function criarUsuario(
  email: string,
  senha: string,
  perfil: Perfil,
  refId: string,
) {
  return Usuarios.create({
    email: email.toLowerCase().trim(),
    senha: bcrypt.hashSync(senha, 10),
    perfil,
    refId,
  });
}
export async function removerUsuarioDe(refId: string) {
  for (const u of await Usuarios.list({ refId })) await Usuarios.remove(u._id);
}
