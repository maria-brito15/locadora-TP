export const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const soDigitos = (v: string) => v.replace(/\D/g, "");

export const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
