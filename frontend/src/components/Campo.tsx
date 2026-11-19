import { InputHTMLAttributes, ReactNode } from "react";

export function Campo({
  rotulo,
  ...props
}: { rotulo: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label>
      {rotulo}
      <input {...props} />
    </label>
  );
}

export function Erro({ texto }: { texto: string | null }) {
  return texto ? <p className="erro">{texto}</p> : null;
}

export function Formulario({
  onSubmit,
  children,
}: {
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}
