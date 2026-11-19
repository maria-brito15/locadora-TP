import { randomUUID } from "crypto";

const BASE = process.env.RESTHEART_URL ?? "http://localhost:8080";
const DB = process.env.RESTHEART_DB ?? "locadora";
const AUTH =
  "Basic " +
  Buffer.from(
    `${process.env.RH_USER ?? "admin"}:${process.env.RH_PASS ?? "secret"}`,
  ).toString("base64");
const COLS = [
  "usuarios",
  "clientes",
  "agentes",
  "automoveis",
  "pedidos",
  "avaliacoes",
  "contratos",
];

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: AUTH,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status >= 400 && res.status !== 404 && res.status !== 409)
    throw new Error(
      `RESTHeart ${method} ${path} -> ${res.status} ${await res.text()}`,
    );

  const txt = await res.text();

  return { status: res.status, data: txt ? JSON.parse(txt) : null };
}

export async function init() {
  await call("PUT", `/${DB}`, {});
  for (const c of COLS) await call("PUT", `/${DB}/${c}`, {});
}

export function col<T extends { _id: string }>(name: string) {
  const url = (id?: string) =>
    `/${DB}/${name}${id ? "/" + encodeURIComponent(id) : ""}`;

  return {
    async list(filter: object = {}): Promise<T[]> {
      const f = Object.keys(filter).length
        ? `&filter=${encodeURIComponent(JSON.stringify(filter))}`
        : "";
      const r = await call("GET", `${url()}?pagesize=1000${f}`);

      return Array.isArray(r.data) ? r.data : [];
    },
    async get(id: string): Promise<T | null> {
      const r = await call("GET", url(id));

      return r.status === 404 ? null : r.data;
    },
    async create(doc: Omit<T, "_id">): Promise<string> {
      const _id = randomUUID();

      await call("POST", url(), { ...doc, _id });

      return _id;
    },
    async update(id: string, patch: Partial<Omit<T, "_id">>) {
      await call("PATCH", url(id), patch);
    },
    async remove(id: string) {
      await call("DELETE", url(id));
    },
  };
}
