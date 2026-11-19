import { expect, test } from "@playwright/test";
import {
  BANCO,
  EMPRESA,
  SENHA,
  aceitarDialogos,
  cadastrarCliente,
  criarPedido,
  linha,
  login,
  logout,
  novaSessao,
  unico,
} from "./helpers";

test.describe("Agente", () => {
  test.beforeEach(({ page }) => aceitarDialogos(page));

  test("banco aprova pedido com contrato de crédito", async ({
    page,
    browser,
  }) => {
    const { nome, email } = await cadastrarCliente(page);

    await login(page, email);
    await criarPedido(page);

    const agente = await novaSessao(browser, BANCO);

    await linha(agente.page, nome)
      .getByRole("link", { name: "Avaliar" })
      .click();
    await expect(
      agente.page.getByText("Contrato de crédito (opcional"),
    ).toBeVisible();
    await agente.page.getByLabel("Parecer").selectOption("aprovado");
    await agente.page
      .getByLabel("Observação / justificativa")
      .fill("Renda compatível");
    await agente.page.getByLabel("Valor financiado (R$)").fill("8000");
    await agente.page.getByLabel("Prazo (meses)").fill("24");
    await agente.page
      .getByRole("button", { name: "Registrar avaliação" })
      .click();

    await expect(linha(agente.page, nome)).toContainText("Aprovado");
    await expect(linha(agente.page, nome)).toContainText("Renda compatível");
    await expect(linha(agente.page, nome)).toContainText(
      "Crédito: R$ 8000 em 24 meses",
    );

    await page.goto("/pedidos");
    await expect(linha(page, nome)).toContainText("Aprovado");
    await expect(linha(page, nome)).toContainText("Banco Demo S.A.");
    await agente.ctx.close();
  });

  test("agente reprova pedido com justificativa", async ({ page, browser }) => {
    const { nome, email } = await cadastrarCliente(page);

    await login(page, email);
    await criarPedido(page);

    const agente = await novaSessao(browser, EMPRESA);

    await linha(agente.page, nome)
      .getByRole("link", { name: "Avaliar" })
      .click();
    await agente.page.getByLabel("Parecer").selectOption("reprovado");
    await agente.page
      .getByLabel("Observação / justificativa")
      .fill("Renda insuficiente");
    await agente.page
      .getByRole("button", { name: "Registrar avaliação" })
      .click();

    await expect(linha(agente.page, nome)).toContainText("Reprovado");
    await expect(
      linha(agente.page, nome).getByRole("link", { name: "Avaliar" }),
    ).toHaveCount(0);

    await page.goto("/pedidos");
    await expect(linha(page, nome)).toContainText("Reprovado");
    await expect(linha(page, nome)).toContainText("Renda insuficiente");
    await agente.ctx.close();
  });

  test("agente do tipo empresa não vê campos de crédito", async ({
    page,
    browser,
  }) => {
    const { nome, email } = await cadastrarCliente(page);

    await login(page, email);
    await criarPedido(page);

    const agente = await novaSessao(browser, EMPRESA);

    await linha(agente.page, nome)
      .getByRole("link", { name: "Avaliar" })
      .click();
    await expect(agente.page.getByText("Avaliação financeira")).toBeVisible();
    await expect(agente.page.getByLabel("Valor financiado (R$)")).toHaveCount(
      0,
    );
    await agente.ctx.close();
  });

  test("justificativa é obrigatória na avaliação", async ({
    page,
    browser,
  }) => {
    const { nome, email } = await cadastrarCliente(page);

    await login(page, email);
    await criarPedido(page);

    const agente = await novaSessao(browser, BANCO);

    await linha(agente.page, nome)
      .getByRole("link", { name: "Avaliar" })
      .click();
    await agente.page.getByLabel("Observação / justificativa").fill("   ");
    await agente.page
      .getByRole("button", { name: "Registrar avaliação" })
      .click();
    await expect(
      agente.page.getByText("Informe a justificativa"),
    ).toBeVisible();
    await agente.ctx.close();
  });

  test("filtra pedidos em análise e esconde os já avaliados", async ({
    page,
    browser,
  }) => {
    const { nome, email } = await cadastrarCliente(page);

    await login(page, email);
    await criarPedido(page);

    const agente = await novaSessao(browser, BANCO);

    await agente.page.getByRole("button", { name: "Em análise" }).click();
    await expect(linha(agente.page, nome)).toBeVisible();

    await linha(agente.page, nome)
      .getByRole("link", { name: "Avaliar" })
      .click();
    await agente.page
      .getByLabel("Observação / justificativa")
      .fill("Aprovado sem crédito");
    await agente.page
      .getByRole("button", { name: "Registrar avaliação" })
      .click();

    await agente.page.getByRole("button", { name: "Em análise" }).click();
    await expect(linha(agente.page, nome)).toHaveCount(0);
    await agente.page.getByRole("button", { name: "Todos" }).click();
    await expect(linha(agente.page, nome)).toContainText("Aprovado");
    await agente.ctx.close();
  });

  test("CRUD de automóvel com proprietário", async ({ page }) => {
    const modelo = unico("Modelo");

    await login(page, BANCO);
    await page.getByRole("link", { name: "Automóveis" }).click();
    await page.getByRole("link", { name: "+ Novo automóvel" }).click();
    await page.getByLabel("Marca").fill("Honda");
    await page.getByLabel("Modelo").fill(modelo);
    await page.getByLabel("Ano").fill("2023");
    await page.getByLabel("Placa").fill("e2e1a23");
    await page.getByLabel("Matrícula / identificador").fill("RENAVAM-E2E");
    await page
      .getByLabel("Proprietário atual")
      .selectOption({ label: "Banco — Banco Demo S.A." });
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(linha(page, modelo)).toContainText("E2E1A23");
    await expect(linha(page, modelo)).toContainText("Banco — Banco Demo S.A.");

    await linha(page, modelo).getByRole("link", { name: "Editar" }).click();
    await expect(page.getByLabel("Ano")).toHaveValue("2023");
    await page.getByLabel("Ano").fill("2024");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(linha(page, modelo)).toContainText("2024");

    await linha(page, modelo).getByRole("button", { name: "Excluir" }).click();
    await expect(linha(page, modelo)).toHaveCount(0);
  });

  test("automóvel exige ano válido", async ({ page }) => {
    await login(page, BANCO);
    await page.goto("/automoveis/novo");
    await page.getByLabel("Marca").fill("Ford");
    await page.getByLabel("Modelo").fill("Ka");
    await page.getByLabel("Ano").fill("1500");
    await page.getByLabel("Placa").fill("AAA0A00");
    await page.getByLabel("Matrícula / identificador").fill("R-1");
    await page
      .getByLabel("Proprietário atual")
      .selectOption({ label: "Banco — Banco Demo S.A." });
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Ano inválido")).toBeVisible();
  });

  test("CRUD de agente e login do novo agente", async ({ page, browser }) => {
    const nome = unico("Agente");
    const email = `${nome.toLowerCase()}@teste.com`;

    await login(page, BANCO);
    await page.getByRole("link", { name: "Agentes" }).click();
    await page.getByRole("link", { name: "+ Novo agente" }).click();
    await page.getByLabel("Nome", { exact: true }).fill(nome);
    await page.getByLabel("CNPJ").fill("22.222.222/0001-22");
    await page.getByLabel("Endereço").fill("Av. Teste, 1");
    await page.getByLabel("Tipo").selectOption("empresa");
    await page.getByLabel("E-mail (login)").fill(email);
    await page.getByLabel("Senha (mín. 6)").fill(SENHA);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(linha(page, nome)).toContainText("empresa");

    const novo = await novaSessao(browser, email);

    await expect(
      novo.page.getByRole("button", { name: new RegExp(`Sair \\(${nome}`) }),
    ).toBeVisible();
    await novo.ctx.close();

    await linha(page, nome).getByRole("link", { name: "Editar" }).click();
    await expect(page.getByLabel("Tipo")).toHaveValue("empresa");
    await expect(page.getByLabel("Nome", { exact: true })).toHaveValue(nome);
    await page.getByLabel("Tipo").selectOption("banco");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(linha(page, nome)).toContainText("banco");

    await linha(page, nome).getByRole("button", { name: "Excluir" }).click();
    await expect(linha(page, nome)).toHaveCount(0);
  });

  test("agente não pode excluir a si mesmo", async ({ page }) => {
    await login(page, EMPRESA);
    await page.goto("/agentes");
    await linha(page, "Locadora Demo Ltda")
      .getByRole("button", { name: "Excluir" })
      .click();
    await expect(
      page.getByText("Você não pode excluir a si mesmo"),
    ).toBeVisible();
    await expect(linha(page, "Locadora Demo Ltda")).toBeVisible();
  });

  test("agente consulta todos os clientes e não cria pedidos", async ({
    page,
  }) => {
    const { nome } = await cadastrarCliente(page);

    await login(page, BANCO);
    await page.getByRole("link", { name: "Clientes" }).click();
    await expect(linha(page, nome)).toBeVisible();
    await expect(
      linha(page, nome).getByRole("link", { name: "Editar" }),
    ).toHaveCount(0);

    await page.goto("/pedidos/novo");
    await expect(page).toHaveURL(/\/pedidos$/);
    await logout(page);
  });
});
