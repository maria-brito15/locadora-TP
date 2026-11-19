export type Perfil = "cliente" | "agente";
export type TipoAgente = "empresa" | "banco";
export type Status =
  | "Em análise"
  | "Aprovado"
  | "Reprovado"
  | "Cancelado"
  | "Contrato em execução";

export interface User {
  id: string;
  perfil: Perfil;
  refId: string;
  nome: string;
  tipoAgente?: TipoAgente;
}

export interface Emprego {
  entidade: string;
  rendimento: number | string;
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
  proprietarioNome?: string;
  proprietario?: string;
}

export interface Avaliacao {
  _id: string;
  agenteNome: string;
  parecer: "aprovado" | "reprovado";
  data: string;
  observacao: string;
}

export interface Contrato {
  valor: number;
  prazo: number;
  situacao: string;
}

export interface Pedido {
  _id: string;
  clienteId: string;
  automovelId: string;
  inicio: string;
  fim: string;
  criadoEm: string;
  status: Status;
  clienteNome: string;
  carro: string;
  avaliacoes: Avaliacao[];
  contrato: Contrato | null;
}
