import { expect, test } from "@playwright/test";
import {
  SENHA,
  aceitarDialogos,
  cadastrarCliente,
  cpfUnico,
  criarPedido,
  linha,
  login,
  logout,
} from "./helpers";

test.describe("Cliente", () => {
  test.beforeEach(({ page }) => aceitarDialogos(page));

  test("cadastra-se, entra, vê o próprio cadastro e sai", async ({ page }) => {
    const { nome, email } = await cadastrarCliente(page);

    await login(page, email);
    await expect(page).toHaveURL(/\/pedidos$/);
    await expect(
      page.getByRole("button", { name: new RegExp(`Sair \\(${nome}`) }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Clientes" }).click();
    await expect(page.getByRole("row")).toHaveCount(2);
    await expect(linha(page, nome)).toContainText("Empresa Teste (R$ 5000)");

    await logout(page);
  });

  test("login com senha errada mostra erro", async ({ page }) => {
    const { email } = await cadastrarCliente(page);

    await login(page, email, "senha-errada");
    await expect(page.getByText("Credenciais inválidas")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("cadastro rejeita senha curta e e-mail repetido", async ({ page }) => {
    const { email } = await cadastrarCliente(page);

    await page.goto("/registro");
    await page.getByLabel("Nome", { exact: true }).fill("Outra Pessoa");
    await page.getByLabel("CPF").fill(cpfUnico());
    await page.getByLabel("RG").fill("1");
    await page.getByLabel("Endereço").fill("Rua X");
    await page.getByLabel("Profissão").fill("Dev");
    await page.getByLabel("E-mail (login)").fill("curta@teste.com");
    await page.getByLabel("Senha (mín. 6)").fill("123");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(
      page.getByText("Senha deve ter ao menos 6 caracteres"),
    ).toBeVisible();

    await page.getByLabel("E-mail (login)").fill(email);
    await page.getByLabel("Senha (mín. 6)").fill(SENHA);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("E-mail já cadastrado")).toBeVisible();
  });

  test("formulário limita a 3 vínculos empregatícios", async ({ page }) => {
    await page.goto("/registro");
    await expect(page.getByLabel(/^Entidade empregadora/)).toHaveCount(3);
  });

  test("edita o cadastro e exclui a própria conta", async ({ page }) => {
    const { nome, email } = await cadastrarCliente(page);

    await login(page, email);
    await page.getByRole("link", { name: "Clientes" }).click();
    await linha(page, nome).getByRole("link", { name: "Editar" }).click();
    await expect(page.getByLabel("Profissão")).toHaveValue("Testadora");
    await page.getByLabel("Profissão").fill("Engenheira de Testes");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(linha(page, nome)).toContainText("Engenheira de Testes");

    await linha(page, nome).getByRole("button", { name: "Excluir" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await login(page, email);
    await expect(page.getByText("Credenciais inválidas")).toBeVisible();
  });

  test("cria, edita e cancela um pedido de aluguel", async ({ page }) => {
    const { nome, email } = await cadastrarCliente(page);

    await login(page, email);
    await criarPedido(page);
    await expect(linha(page, nome)).toContainText("Em análise");
    await expect(linha(page, nome)).toContainText("2026-12-20 → 2026-12-27");

    await page.getByRole("link", { name: "Editar" }).click();
    await expect(page.getByLabel("Fim")).toHaveValue("2026-12-27");
    await page.getByLabel("Fim").fill("2026-12-30");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(linha(page, nome)).toContainText("2026-12-20 → 2026-12-30");

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(linha(page, nome)).toContainText("Cancelado");
    await expect(
      linha(page, nome).getByRole("button", { name: "Cancelar" }),
    ).toHaveCount(0);
    await expect(
      linha(page, nome).getByRole("link", { name: "Editar" }),
    ).toHaveCount(0);
  });

  test("rejeita pedido com período invertido", async ({ page }) => {
    const { email } = await cadastrarCliente(page);

    await login(page, email);
    await page.goto("/pedidos/novo");
    await page
      .getByLabel("Automóvel")
      .selectOption({ label: "Toyota Corolla 2022 (ABC1D23)" });
    await page.getByLabel("Início").fill("2026-12-20");
    await page.getByLabel("Fim").fill("2026-12-10");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(
      page.getByText("A data final deve ser posterior à inicial"),
    ).toBeVisible();
  });

  test("cliente só vê os próprios pedidos", async ({ page }) => {
    const { nome, email } = await cadastrarCliente(page);

    await login(page, email);
    await expect(page.getByRole("row")).toHaveCount(1);
    await criarPedido(page);
    await expect(page.getByRole("row")).toHaveCount(2);
    await expect(linha(page, nome)).toBeVisible();
    await expect(page.getByText("Maria Silva")).toHaveCount(0);
  });

  test("não acessa telas de agente nem de outro perfil", async ({ page }) => {
    const { email } = await cadastrarCliente(page);

    await login(page, email);
    await expect(page).toHaveURL(/\/pedidos$/);
    await expect(page.getByRole("link", { name: "Agentes" })).toHaveCount(0);

    await page.goto("/agentes");
    await expect(page).toHaveURL(/\/pedidos$/);

    await page.goto("/automoveis/novo");
    await expect(page).toHaveURL(/\/pedidos$/);

    await page.goto("/automoveis");
    await expect(
      page.getByRole("link", { name: "+ Novo automóvel" }),
    ).toHaveCount(0);
  });
});

test.describe("Visitante", () => {
  test("é redirecionado para o login ao abrir telas protegidas", async ({
    page,
  }) => {
    for (const rota of ["/pedidos", "/clientes", "/automoveis", "/agentes"]) {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/login$/);
    }
  });
});
