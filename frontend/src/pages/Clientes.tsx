import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, mensagem } from "../api";
import { useAuth } from "../auth";
import { Erro } from "../components/Campo";
import { Cliente } from "../types";

export default function Clientes() {
  const { user, recarregar } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Cliente[]>("/clientes")
      .then(setClientes)
      .catch((e) => setErro(mensagem(e)));
  }, []);

  const excluir = async (id: string) => {
    if (!confirm("Excluir sua conta e pedidos?")) return;
    try {
      await api.del(`/clientes/${id}`);
      await recarregar();
      navigate("/login");
    } catch (e) {
      setErro(mensagem(e));
    }
  };

  return (
    <>
      <h2>Clientes</h2>
      <Erro texto={erro} />
      <div className="tabela">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>RG</th>
              <th>Endereço</th>
              <th>Profissão</th>
              <th>Vínculos / rendimentos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c._id}>
                <td>{c.nome}</td>
                <td>{c.cpf}</td>
                <td>{c.rg}</td>
                <td>{c.endereco}</td>
                <td>{c.profissao}</td>
                <td>
                  {c.empregos
                    .map((e) => `${e.entidade} (R$ ${e.rendimento})`)
                    .join("; ")}
                </td>
                <td className="acoes">
                  {user?.refId === c._id && (
                    <>
                      <Link to={`/clientes/${c._id}/editar`}>Editar</Link>
                      <button className="perigo" onClick={() => excluir(c._id)}>
                        Excluir
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
