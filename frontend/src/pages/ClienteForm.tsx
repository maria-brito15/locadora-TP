import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, mensagem } from "../api";
import { useAuth } from "../auth";
import { Campo, Erro, Formulario } from "../components/Campo";
import { Cliente, Emprego } from "../types";

const vazio: Emprego = { entidade: "", rendimento: "" };

export default function ClienteForm() {
  const { id } = useParams();
  const { recarregar } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({
    nome: "",
    cpf: "",
    rg: "",
    endereco: "",
    profissao: "",
    email: "",
    senha: "",
  });
  const [empregos, setEmpregos] = useState<Emprego[]>([vazio, vazio, vazio]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let ativo = true;

    api
      .get<Cliente>(`/clientes/${id}`)
      .then((c) => {
        if (!ativo) return;
        setF((x) => ({ ...x, ...c }));
        setEmpregos([...c.empregos, vazio, vazio, vazio].slice(0, 3));
      })
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
  const emprego = (i: number, k: keyof Emprego, v: string) =>
    setEmpregos(empregos.map((e, j) => (j === i ? { ...e, [k]: v } : e)));

  const enviar = async () => {
    try {
      if (id) {
        await api.put(`/clientes/${id}`, { ...f, empregos });
        await recarregar();
        navigate("/clientes");
      } else {
        await api.post("/registro", { ...f, empregos });
        navigate("/login");
      }
    } catch (e) {
      setErro(mensagem(e));
    }
  };

  return (
    <>
      <h2>{id ? "Editar cliente" : "Cadastro de cliente"}</h2>
      <Erro texto={erro} />
      <Formulario onSubmit={enviar}>
        <Campo rotulo="Nome" {...campo("nome")} required />
        <Campo rotulo="CPF" {...campo("cpf")} required />
        <Campo rotulo="RG" {...campo("rg")} required />
        <Campo rotulo="Endereço" {...campo("endereco")} required />
        <Campo rotulo="Profissão" {...campo("profissao")} required />
        <h4>Vínculos empregatícios (máx. 3)</h4>
        {empregos.map((e, i) => (
          <div key={i}>
            <Campo
              rotulo={`Entidade empregadora ${i + 1}`}
              value={e.entidade}
              onChange={(ev) => emprego(i, "entidade", ev.target.value)}
            />
            <Campo
              rotulo="Rendimento (R$)"
              type="number"
              step="0.01"
              min="0"
              value={e.rendimento}
              onChange={(ev) => emprego(i, "rendimento", ev.target.value)}
            />
          </div>
        ))}
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
