import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, mensagem } from "../api";
import { Campo, Erro, Formulario } from "../components/Campo";
import { Agente } from "../types";

export default function AgenteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [f, setF] = useState({
    nome: "",
    cnpj: "",
    endereco: "",
    tipo: "empresa",
    email: "",
    senha: "",
  });
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let ativo = true;

    api
      .get<Agente>(`/agentes/${id}`)
      .then((a) => ativo && setF((x) => ({ ...x, ...a })))
      .catch((e) => setErro(mensagem(e)));

    return () => {
      ativo = false;
    };
  }, [id]);

  const campo = (k: keyof typeof f) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setF({ ...f, [k]: e.target.value }),
  });

  const enviar = async () => {
    try {
      if (id) await api.put(`/agentes/${id}`, f);
      else await api.post("/agentes", f);
      navigate("/agentes");
    } catch (e) {
      setErro(mensagem(e));
    }
  };

  return (
    <>
      <h2>{id ? "Editar agente" : "Novo agente"}</h2>
      <Erro texto={erro} />
      <Formulario onSubmit={enviar}>
        <Campo rotulo="Nome" {...campo("nome")} required />
        <Campo rotulo="CNPJ" {...campo("cnpj")} required />
        <Campo rotulo="Endereço" {...campo("endereco")} required />
        <label>
          Tipo
          <select
            value={f.tipo}
            onChange={(e) => setF({ ...f, tipo: e.target.value })}
          >
            <option value="empresa">Empresa</option>
            <option value="banco">Banco</option>
          </select>
        </label>
        {!id && (
          <>
            <Campo
              rotulo="E-mail (login)"
              type="email"
              {...campo("email")}
              required
            />
            <Campo
              rotulo="Senha (mín. 6)"
              type="password"
              {...campo("senha")}
              required
            />
          </>
        )}
        <button>Salvar</button>
      </Formulario>
    </>
  );
}
