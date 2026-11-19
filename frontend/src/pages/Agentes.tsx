import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensagem } from "../api";
import { Erro } from "../components/Campo";
import { Agente } from "../types";

export default function Agentes() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(
    () =>
      api
        .get<Agente[]>("/agentes")
        .then(setAgentes)
        .catch((e) => setErro(mensagem(e))),
    [],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const excluir = async (id: string) => {
    if (!confirm("Excluir?")) return;
    try {
      await api.del(`/agentes/${id}`);
      setErro(null);
      await carregar();
    } catch (e) {
      setErro(mensagem(e));
    }
  };

  return (
    <>
      <h2>Agentes</h2>
      <p>
        <Link to="/agentes/novo">+ Novo agente</Link>
      </p>
      <Erro texto={erro} />
      <div className="tabela">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CNPJ</th>
              <th>Endereço</th>
              <th>Tipo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {agentes.map((a) => (
              <tr key={a._id}>
                <td>{a.nome}</td>
                <td>{a.cnpj}</td>
                <td>{a.endereco}</td>
                <td>{a.tipo}</td>
                <td className="acoes">
                  <Link to={`/agentes/${a._id}/editar`}>Editar</Link>
                  <button className="perigo" onClick={() => excluir(a._id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
