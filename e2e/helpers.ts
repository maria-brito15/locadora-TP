import { Browser, Page, expect } from "@playwright/test";

export const SENHA = "123456";
export const BANCO = "banco@demo.com";
export const EMPRESA = "empresa@demo.com";

export const unico = (p: string) =>
  `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const cpfUnico = () =>
  (Date.now() % 1e8).toString().padStart(8, "0") +
  Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

export function aceitarDialogos(page: Page) {
  page.on("dialog", (d) => d.accept());
}

export async function login(page: Page, email: string, senha = SENHA) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/login")),
    page.getByRole("button", { name: "Entrar" }).click(),
  ]);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /^Sair/ }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function cadastrarCliente(page: Page, prefixo = "Cliente") {
  const nome = unico(prefixo);
  const email = `${nome.toLowerCase()}@teste.com`;

  await page.goto("/registro");
  await page.getByLabel("Nome", { exact: true }).fill(nome);
  await page.getByLabel("CPF").fill(cpfUnico());
  await page.getByLabel("RG").fill("MG-1234567");
  await page.getByLabel("Endereço").fill("Rua dos Testes, 100");
  await page.getByLabel("Profissão").fill("Testadora");
  await page.getByLabel("Entidade empregadora 1").fill("Empresa Teste");
  await page.getByLabel("Rendimento (R$)").first().fill("5000");
  await page.getByLabel("E-mail (login)").fill(email);
  await page.getByLabel("Senha (mín. 6)").fill(SENHA);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page).toHaveURL(/\/login$/);

  return { nome, email };
}

export async function criarPedido(
  page: Page,
  inicio = "2026-12-20",
  fim = "2026-12-27",
) {
  await page.goto("/pedidos/novo");
  await page
    .getByLabel("Automóvel")
    .selectOption({ label: "Toyota Corolla 2022 (ABC1D23)" });
  await page.getByLabel("Início").fill(inicio);
  await page.getByLabel("Fim").fill(fim);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page).toHaveURL(/\/pedidos$/);
}

export const linha = (page: Page, nome: string) =>
  page.getByRole("row").filter({ hasText: nome });

export async function novaSessao(browser: Browser, email: string) {
  const ctx = await browser.newContext({ locale: "pt-BR" });
  const page = await ctx.newPage();

  aceitarDialogos(page);
  await login(page, email);
  await expect(page).toHaveURL(/\/pedidos$/);

  return { ctx, page };
}
