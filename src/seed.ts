import { init } from "./restheart";
import {
  Agentes,
  Automoveis,
  Clientes,
  Pedidos,
  Usuarios,
  criarUsuario,
} from "./models";

(async () => {
  await init();
  if ((await Usuarios.list({ email: "banco@demo.com" })).length)
    return console.log("Banco já populado.");

  const banco = await Agentes.create({
    nome: "Banco Demo S.A.",
    cnpj: "00.000.000/0001-00",
    endereco: "Av. Central, 1",
    tipo: "banco",
  });

  await criarUsuario("banco@demo.com", "123456", "agente", banco);

  const emp = await Agentes.create({
    nome: "Locadora Demo Ltda",
    cnpj: "11.111.111/0001-11",
    endereco: "Rua B, 20",
    tipo: "empresa",
  });

  await criarUsuario("empresa@demo.com", "123456", "agente", emp);

  const cli = await Clientes.create({
    nome: "Maria Silva",
    cpf: "123.456.789-00",
    rg: "MG-12.345.678",
    endereco: "Rua A, 10",
    profissao: "Engenheira",
    empregos: [{ entidade: "Acme", rendimento: 8000 }],
  });

  await criarUsuario("cliente@demo.com", "123456", "cliente", cli);

  const a1 = await Automoveis.create({
    marca: "Toyota",
    modelo: "Corolla",
    ano: 2022,
    placa: "ABC1D23",
    matricula: "RENAVAM-001",
    proprietarioTipo: "empresa",
    proprietarioId: emp,
  });

  await Automoveis.create({
    marca: "Fiat",
    modelo: "Argo",
    ano: 2021,
    placa: "XYZ9K88",
    matricula: "RENAVAM-002",
    proprietarioTipo: "banco",
    proprietarioId: banco,
  });
  await Pedidos.create({
    clienteId: cli,
    automovelId: a1,
    inicio: "2026-12-01",
    fim: "2026-12-10",
    criadoEm: new Date().toISOString(),
    status: "Em análise",
  });
  console.log(
    "Dados de exemplo criados. Logins (senha 123456): cliente@demo.com, banco@demo.com, empresa@demo.com",
  );
})();
