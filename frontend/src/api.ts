async function call<T>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`/api${url}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) throw new Error(data?.erro ?? `Erro ${res.status}`);

  return data as T;
}

export const api = {
  get: <T>(url: string) => call<T>("GET", url),
  post: <T>(url: string, body?: unknown) => call<T>("POST", url, body ?? {}),
  put: <T>(url: string, body: unknown) => call<T>("PUT", url, body),
  del: <T>(url: string) => call<T>("DELETE", url),
};

export const mensagem = (e: unknown) =>
  e instanceof Error ? e.message : "Erro inesperado";
