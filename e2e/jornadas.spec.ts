import { expect, test } from "@playwright/test";
import {
  BANCO,
  aceitarDialogos,
  cadastrarCliente,
  criarPedido,
  linha,
  login,
  novaSessao,
} from "./helpers";

test.describe("Jornadas completas (cliente e agente em paralelo)", () => {
  test.beforeEach(({ page }) => aceitarDialogos(page));

  test("pedido percorre Em análise → Aprovado → Contrato em execução", async ({
    page,
    browser,
  }) => {
    const { nome, email } = await cadastrarCliente(page, "Jornada");

    await login(page, email);
    await criarPedido(page);
    await expect(linha(page, nome)).toContainText("Em análise");

    const agente = await novaSessao(browser, BANCO);

    await linha(agente.page, nome)
      .getByRole("link", { name: "Avaliar" })
      .click();
    await agente.page
      .getByLabel("Observação / justificativa")
      .fill("Tudo certo");
    await agente.page.getByLabel("Valor financiado (R$)").fill("3000");
    await agente.page.getByLabel("Prazo (meses)").fill("10");
    await agente.page
      .getByRole("button", { name: "Registrar avaliação" })
      .click();
    await expect(linha(agente.page, nome)).toContainText("Aprovado");

    await page.reload();
    await expect(linha(page, nome)).toContainText("Aprovado");
    await expect(
      linha(page, nome).getByRole("link", { name: "Editar" }),
    ).toHaveCount(0);
    await expect(
      linha(page, nome).getByRole("button", { name: "Cancelar" }),
    ).toBeVisible();

    await linha(agente.page, nome)
      .getByRole("button", { name: "Iniciar contrato" })
      .click();
    await expect(linha(agente.page, nome)).toContainText(
      "Contrato em execução",
    );

    await page.reload();
    await expect(linha(page, nome)).toContainText("Contrato em execução");
    await expect(
      linha(page, nome).getByRole("button", { name: "Cancelar" }),
    ).toHaveCount(0);
    await agente.ctx.close();
  });

  test("cliente cancela pedido já aprovado e o agente não consegue executá-lo", async ({
    page,
    browser,
  }) => {
    const { nome, email } = await cadastrarCliente(page, "Cancela");

    await login(page, email);
    await criarPedido(page);

    const agente = await novaSessao(browser, BANCO);

    await linha(agente.page, nome)
      .getByRole("link", { name: "Avaliar" })
      .click();
    await agente.page.getByLabel("Observação / justificativa").fill("Ok");
    await agente.page
      .getByRole("button", { name: "Registrar avaliação" })
      .click();
    await expect(linha(agente.page, nome)).toContainText("Aprovado");

    await page.reload();
    await linha(page, nome).getByRole("button", { name: "Cancelar" }).click();
    await expect(linha(page, nome)).toContainText("Cancelado");

    await linha(agente.page, nome)
      .getByRole("button", { name: "Iniciar contrato" })
      .click();
    await expect(
      agente.page.getByText(
        "Apenas pedidos aprovados podem entrar em execução",
      ),
    ).toBeVisible();

    await agente.page.reload();
    await expect(linha(agente.page, nome)).toContainText("Cancelado");
    await expect(
      linha(agente.page, nome).getByRole("button", {
        name: "Iniciar contrato",
      }),
    ).toHaveCount(0);
    await agente.ctx.close();
  });

  test("pedido cancelado pelo cliente não pode mais ser aprovado", async ({
    page,
    browser,
  }) => {
    const { nome, email } = await cadastrarCliente(page, "Corrida");

    await login(page, email);
    await criarPedido(page);

    const agente = await novaSessao(browser, BANCO);
    const avaliar = linha(agente.page, nome).getByRole("link", {
      name: "Avaliar",
    });
    const href = await avaliar.getAttribute("href");

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(linha(page, nome)).toContainText("Cancelado");

    await agente.page.goto(href!);
    await expect(
      agente.page.getByText("Só pedidos em análise podem ser avaliados"),
    ).toBeVisible();
    await agente.page.getByLabel("Observação / justificativa").fill("Tentando");
    await agente.page
      .getByRole("button", { name: "Registrar avaliação" })
      .click();
    await expect(
      agente.page.getByText("pedido cancelado não pode ser aprovado"),
    ).toBeVisible();

    await page.reload();
    await expect(linha(page, nome)).toContainText("Cancelado");
    await agente.ctx.close();
  });

  test("dois clientes não enxergam os pedidos um do outro", async ({
    page,
    browser,
  }) => {
    const a = await cadastrarCliente(page, "Alice");

    await login(page, a.email);
    await criarPedido(page);

    const ctxB = await browser.newContext({ locale: "pt-BR" });
    const pageB = await ctxB.newPage();

    aceitarDialogos(pageB);

    const b = await cadastrarCliente(pageB, "Bruno");

    await login(pageB, b.email);
    await criarPedido(pageB, "2027-01-10", "2027-01-15");

    await expect(linha(page, a.nome)).toBeVisible();
    await expect(page.getByText(b.nome)).toHaveCount(0);
    await expect(linha(pageB, b.nome)).toBeVisible();
    await expect(pageB.getByText(a.nome)).toHaveCount(0);
    await ctxB.close();
  });
});
