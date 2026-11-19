import {
  APIRequestContext,
  expect,
  request as pwRequest,
  test,
} from "@playwright/test";
import { BANCO, EMPRESA, SENHA, cpfUnico, unico } from "./helpers";

const BASE = "http://localhost:3000";

const anonimo = () => pwRequest.newContext({ baseURL: BASE });

async function sessao(email: string, senha = SENHA) {
  const ctx = await anonimo();
  const r = await ctx.post("/api/login", { data: { email, senha } });

  expect(r.status()).toBe(200);

  return ctx;
}

async function novoCliente(extra: object = {}) {
  const email = `${unico("api").toLowerCase()}@teste.com`;
  const r = await (
    await anonimo()
  ).post("/api/registro", {
    data: {
      nome: "Cliente API",
      cpf: cpfUnico(),
      rg: "MG-1",
      endereco: "Rua API",
      profissao: "Tester",
      empregos: [{ entidade: "Acme", rendimento: 1000 }],
      email,
      senha: SENHA,
      ...extra,
    },
  });

  return { r, email };
}

async function clienteLogado() {
  const { r, email } = await novoCliente();

  expect(r.status()).toBe(201);

  return { ctx: await sessao(email), email };
}

async function primeiroAutomovel(ctx: APIRequestContext) {
  const lista = await (await ctx.get("/api/automoveis")).json();

  return lista[0]._id as string;
}

async function criarPedido(ctx: APIRequestContext) {
  const r = await ctx.post("/api/pedidos", {
    data: {
      automovelId: await primeiroAutomovel(ctx),
      inicio: "2026-12-01",
      fim: "2026-12-05",
    },
  });

  expect(r.status()).toBe(201);

  return (await r.json()).id as string;
}

const status = async (ctx: APIRequestContext, id: string) =>
  (await (await ctx.get(`/api/pedidos/${id}`)).json()).status;

const tresVinculos = ["a", "b", "c"].map((entidade) => ({
  entidade,
  rendimento: 1,
}));
const quatroVinculos = [...tresVinculos, { entidade: "d", rendimento: 1 }];

test.describe("API: autenticação", () => {
  test("rotas protegidas exigem login", async () => {
    const anon = await anonimo();

    for (const rota of ["/api/pedidos", "/api/clientes", "/api/automoveis"])
      expect((await anon.get(rota)).status()).toBe(401);
  });

  test("login inválido é rejeitado e a senha não é exposta", async () => {
    const anon = await anonimo();
    const ruim = await anon.post("/api/login", {
      data: { email: BANCO, senha: "errada" },
    });

    expect(ruim.status()).toBe(401);

    const ok = await anon.post("/api/login", {
      data: { email: BANCO, senha: SENHA },
    });

    expect(JSON.stringify(await ok.json())).not.toContain("senha");
  });
});

test.describe("API: clientes", () => {
  test("rejeita mais de 3 vínculos empregatícios", async () => {
    const { r } = await novoCliente({ empregos: quatroVinculos });

    expect(r.status()).toBe(400);
    expect((await r.json()).erro).toMatch(/3 vínculos/);
  });

  test("aceita 3 vínculos e rejeita um 4º na edição", async () => {
    const { r, email } = await novoCliente({ empregos: tresVinculos });

    expect(r.status()).toBe(201);

    const ctx = await sessao(email);
    const [eu] = await (await ctx.get("/api/clientes")).json();
    const put = await ctx.put(`/api/clientes/${eu._id}`, {
      data: { ...eu, empregos: quatroVinculos },
    });

    expect(put.status()).toBe(400);
  });

  test("valida CPF, e-mail, tipos, senha e duplicidade", async () => {
    expect((await novoCliente({ cpf: "1" })).r.status()).toBe(400);
    expect((await novoCliente({ email: "invalido" })).r.status()).toBe(400);
    expect((await novoCliente({ nome: { x: 1 } })).r.status()).toBe(400);
    expect((await novoCliente({ senha: "123" })).r.status()).toBe(400);

    const cpf = cpfUnico();

    expect((await novoCliente({ cpf })).r.status()).toBe(201);
    expect((await novoCliente({ cpf })).r.status()).toBe(400);
  });

  test("cliente não lê, edita nem exclui outro cliente", async () => {
    const a = await clienteLogado();
    const b = await clienteLogado();
    const [eleA] = await (await a.ctx.get("/api/clientes")).json();

    expect((await b.ctx.get(`/api/clientes/${eleA._id}`)).status()).toBe(403);

    const put = await b.ctx.put(`/api/clientes/${eleA._id}`, { data: eleA });

    expect(put.status()).toBe(403);

    const del = await b.ctx.delete(`/api/clientes/${eleA._id}`);

    expect(del.status()).toBe(403);
    expect((await (await b.ctx.get("/api/clientes")).json()).length).toBe(1);
  });
});

test.describe("API: pedidos (isolamento e permissões)", () => {
  test("cliente não vê, edita nem cancela pedido de outro", async () => {
    const dono = await clienteLogado();
    const intruso = await clienteLogado();
    const id = await criarPedido(dono.ctx);
    const put = await intruso.ctx.put(`/api/pedidos/${id}`, {
      data: {
        automovelId: await primeiroAutomovel(intruso.ctx),
        inicio: "2026-01-01",
        fim: "2026-01-02",
      },
    });

    expect((await intruso.ctx.get(`/api/pedidos/${id}`)).status()).toBe(403);
    expect(put.status()).toBe(403);

    const cancelar = await intruso.ctx.post(`/api/pedidos/${id}/cancelar`);

    expect(cancelar.status()).toBe(403);

    const lista = await (await intruso.ctx.get("/api/pedidos")).json();

    expect(lista).toHaveLength(0);
    expect(await status(dono.ctx, id)).toBe("Em análise");
  });

  test("cliente não avalia, executa nem gerencia agentes/automóveis", async () => {
    const { ctx } = await clienteLogado();
    const id = await criarPedido(ctx);
    const avaliar = await ctx.post(`/api/pedidos/${id}/avaliar`, {
      data: { parecer: "aprovado", observacao: "x" },
    });

    expect(avaliar.status()).toBe(403);
    expect((await ctx.post(`/api/pedidos/${id}/executar`)).status()).toBe(403);
    expect((await ctx.get("/api/agentes")).status()).toBe(403);
    expect((await ctx.post("/api/agentes", { data: {} })).status()).toBe(403);

    const carro = await ctx.post("/api/automoveis", { data: {} });

    expect(carro.status()).toBe(403);
    expect(await status(ctx, id)).toBe("Em análise");
  });

  test("status/agente não podem ser forçados pelo cliente via PUT", async () => {
    const { ctx } = await clienteLogado();
    const id = await criarPedido(ctx);

    await ctx.put(`/api/pedidos/${id}`, {
      data: {
        automovelId: await primeiroAutomovel(ctx),
        inicio: "2026-12-01",
        fim: "2026-12-05",
        status: "Aprovado",
        agenteId: "x",
        clienteId: "outro",
      },
    });

    const p = await (await ctx.get(`/api/pedidos/${id}`)).json();

    expect(p.status).toBe("Em análise");
    expect(p.agenteId).toBeUndefined();
  });

  test("valida automóvel inexistente e datas", async () => {
    const { ctx } = await clienteLogado();
    const auto = await primeiroAutomovel(ctx);
    const post = (data: object) => ctx.post("/api/pedidos", { data });
    const inexistente = {
      automovelId: "nao-existe",
      inicio: "2026-12-01",
      fim: "2026-12-02",
    };

    expect((await post(inexistente)).status()).toBe(400);

    const invertido = {
      automovelId: auto,
      inicio: "2026-12-05",
      fim: "2026-12-01",
    };
    const impossivel = {
      automovelId: auto,
      inicio: "2026-13-45",
      fim: "2026-13-46",
    };

    expect((await post(invertido)).status()).toBe(400);
    expect((await post(impossivel)).status()).toBe(400);

    const id = await criarPedido(ctx);
    const put = await ctx.put(`/api/pedidos/${id}`, { data: inexistente });

    expect(put.status()).toBe(400);
  });

  test("agente não cria pedidos", async () => {
    const ag = await sessao(BANCO);

    expect((await ag.post("/api/pedidos", { data: {} })).status()).toBe(403);
  });
});

test.describe("API: avaliação financeira e contrato de crédito", () => {
  test("aprovação registra agente, data, parecer e atualiza o status", async () => {
    const { ctx } = await clienteLogado();
    const id = await criarPedido(ctx);
    const banco = await sessao(BANCO);
    const semJustificativa = await banco.post(`/api/pedidos/${id}/avaliar`, {
      data: { parecer: "aprovado", observacao: " " },
    });

    expect(semJustificativa.status()).toBe(400);

    const r = await banco.post(`/api/pedidos/${id}/avaliar`, {
      data: { parecer: "aprovado", observacao: "Renda compatível" },
    });

    expect(r.status()).toBe(200);

    const p = await (await ctx.get(`/api/pedidos/${id}`)).json();

    expect(p.status).toBe("Aprovado");
    expect(p.agenteId).toBeTruthy();
    expect(p.avaliacoes).toHaveLength(1);
    expect(p.avaliacoes[0]).toMatchObject({
      parecer: "aprovado",
      observacao: "Renda compatível",
      agenteId: p.agenteId,
    });
    expect(Date.parse(p.avaliacoes[0].data)).not.toBeNaN();
    expect(p.contrato).toBeNull();

    const outra = await banco.post(`/api/pedidos/${id}/avaliar`, {
      data: { parecer: "reprovado", observacao: "x" },
    });

    expect(outra.status()).toBe(400);
  });

  test("reprovação atualiza o status para Reprovado", async () => {
    const { ctx } = await clienteLogado();
    const id = await criarPedido(ctx);
    const emp = await sessao(EMPRESA);

    await emp.post(`/api/pedidos/${id}/avaliar`, {
      data: { parecer: "reprovado", observacao: "Renda insuficiente" },
    });
    expect(await status(ctx, id)).toBe("Reprovado");
  });

  test("só banco concede crédito; contrato guarda valor, prazo, situação e banco", async () => {
    const { ctx } = await clienteLogado();
    const id = await criarPedido(ctx);
    const dados = {
      parecer: "aprovado",
      observacao: "ok",
      valor: 15000,
      prazo: 24,
      situacao: "Concedido",
    };
    const emp = await sessao(EMPRESA);
    const negado = await emp.post(`/api/pedidos/${id}/avaliar`, {
      data: dados,
    });

    expect(negado.status()).toBe(400);
    expect((await negado.json()).erro).toMatch(/banco/);
    expect(await status(ctx, id)).toBe("Em análise");

    const banco = await sessao(BANCO);
    const semPrazo = await banco.post(`/api/pedidos/${id}/avaliar`, {
      data: { ...dados, prazo: 0 },
    });

    expect(semPrazo.status()).toBe(400);

    const ok = await banco.post(`/api/pedidos/${id}/avaliar`, { data: dados });

    expect(ok.status()).toBe(200);

    const p = await (await ctx.get(`/api/pedidos/${id}`)).json();

    expect(p.contrato).toMatchObject({
      pedidoId: id,
      valor: 15000,
      prazo: 24,
      situacao: "Concedido",
    });
    expect(p.contrato.bancoId).toBe(p.agenteId);
  });

  test("pedido cancelado não pode ser aprovado, executado nem editado", async () => {
    const { ctx } = await clienteLogado();
    const id = await criarPedido(ctx);

    expect((await ctx.post(`/api/pedidos/${id}/cancelar`)).status()).toBe(200);

    const banco = await sessao(BANCO);
    const aprovar = await banco.post(`/api/pedidos/${id}/avaliar`, {
      data: { parecer: "aprovado", observacao: "x" },
    });

    expect(aprovar.status()).toBe(400);
    expect((await banco.post(`/api/pedidos/${id}/executar`)).status()).toBe(
      400,
    );
    expect(await status(ctx, id)).toBe("Cancelado");

    const editar = await ctx.put(`/api/pedidos/${id}`, {
      data: {
        automovelId: await primeiroAutomovel(ctx),
        inicio: "2026-12-01",
        fim: "2026-12-02",
      },
    });

    expect(editar.status()).toBe(400);
  });

  test("fluxo: aprovado → execução; execução não pode ser cancelada", async () => {
    const { ctx } = await clienteLogado();
    const id = await criarPedido(ctx);
    const banco = await sessao(BANCO);

    expect((await banco.post(`/api/pedidos/${id}/executar`)).status()).toBe(
      400,
    );
    await banco.post(`/api/pedidos/${id}/avaliar`, {
      data: { parecer: "aprovado", observacao: "ok" },
    });
    expect((await banco.post(`/api/pedidos/${id}/executar`)).status()).toBe(
      200,
    );
    expect((await ctx.post(`/api/pedidos/${id}/cancelar`)).status()).toBe(400);
  });

  test("agente consulta pedidos pendentes por status", async () => {
    const { ctx } = await clienteLogado();
    const id = await criarPedido(ctx);
    const banco = await sessao(BANCO);
    const url = "/api/pedidos?status=" + encodeURIComponent("Em análise");
    const lista: { _id: string; status: string }[] = await (
      await banco.get(url)
    ).json();

    expect(lista.every((p) => p.status === "Em análise")).toBe(true);
    expect(lista.some((p) => p._id === id)).toBe(true);
  });
});

test.describe("API: automóveis e agentes (integridade)", () => {
  const carro = (proprietario: string) => ({
    marca: "Fiat",
    modelo: "Uno",
    ano: 2020,
    placa: "api0a00",
    matricula: "RENAVAM-API",
    proprietario,
  });

  test("automóvel exige proprietário válido (cliente, empresa ou banco)", async () => {
    const banco = await sessao(BANCO);
    const donos: { v: string }[] = await (
      await banco.get("/api/automoveis/donos")
    ).json();

    expect(
      (await banco.post("/api/automoveis", { data: carro("") })).status(),
    ).toBe(400);

    const falso = await banco.post("/api/automoveis", {
      data: carro("banco:inexistente"),
    });

    expect(falso.status()).toBe(400);

    for (const tipo of ["cliente", "empresa", "banco"]) {
      const v = donos.find((d) => d.v.startsWith(tipo + ":"))!.v;
      const r = await banco.post("/api/automoveis", { data: carro(v) });

      expect(r.status()).toBe(201);

      const id = (await r.json()).id;
      const lido = await (await banco.get(`/api/automoveis/${id}`)).json();

      expect(lido.proprietarioTipo).toBe(tipo);
      expect(lido.placa).toBe("API0A00");
      expect((await banco.delete(`/api/automoveis/${id}`)).status()).toBe(200);
    }
  });

  test("não exclui automóvel com pedidos nem agente com vínculos", async () => {
    const { ctx } = await clienteLogado();
    const pedido = await criarPedido(ctx);
    const banco = await sessao(BANCO);
    const p = await (await ctx.get(`/api/pedidos/${pedido}`)).json();

    expect(
      (await banco.delete(`/api/automoveis/${p.automovelId}`)).status(),
    ).toBe(409);

    const proprio = (await (await banco.get("/api/me")).json()).user.refId;
    const ags: { _id: string }[] = await (
      await banco.get("/api/agentes")
    ).json();
    const outro = ags.find((a) => a._id !== proprio)!;

    expect((await banco.delete(`/api/agentes/${outro._id}`)).status()).toBe(
      409,
    );
    expect((await banco.delete(`/api/agentes/${proprio}`)).status()).toBe(400);
  });

  test("cadastro de agente identifica empresa/banco e valida o tipo", async () => {
    const banco = await sessao(BANCO);
    const base = {
      nome: "Agente API",
      cnpj: "33.333.333/0001-33",
      endereco: "Rua",
      senha: SENHA,
    };
    const novo = (tipo: string) =>
      banco.post("/api/agentes", {
        data: {
          ...base,
          tipo,
          email: `${unico("ag").toLowerCase()}@teste.com`,
        },
      });

    expect((await novo("outro")).status()).toBe(400);

    const r = await novo("empresa");

    expect(r.status()).toBe(201);

    const id = (await r.json()).id;
    const lido = await (await banco.get(`/api/agentes/${id}`)).json();

    expect(lido.tipo).toBe("empresa");
    expect((await banco.delete(`/api/agentes/${id}`)).status()).toBe(200);

    const fantasma = await banco.put(`/api/agentes/${id}`, {
      data: { ...base, tipo: "banco" },
    });

    expect(fantasma.status()).toBe(404);
  });
});
