import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensagem } from "../api";
import { useAuth } from "../auth";
import { Erro } from "../components/Campo";
import { Automovel } from "../types";

export default function Automoveis() {
  const { user } = useAuth();
  const agente = user?.perfil === "agente";
  const [autos, setAutos] = useState<Automovel[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(
    () =>
      api
        .get<Automovel[]>("/automoveis")
        .then(setAutos)
        .catch((e) => setErro(mensagem(e))),
    [],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const excluir = async (id: string) => {
    if (!confirm("Excluir?")) return;
    try {
      await api.del(`/automoveis/${id}`);
      await carregar();
    } catch (e) {
      setErro(mensagem(e));
    }
  };

  return (
    <>
      <h2>Automóveis</h2>
      {agente && (
        <p>
          <Link to="/automoveis/novo">+ Novo automóvel</Link>
        </p>
      )}
      <Erro texto={erro} />
      <table>
        <thead>
          <tr>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Ano</th>
            <th>Placa</th>
            <th>Matrícula</th>
            <th>Proprietário</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {autos.map((a) => (
            <tr key={a._id}>
              <td>{a.marca}</td>
              <td>{a.modelo}</td>
              <td>{a.ano}</td>
              <td>{a.placa}</td>
              <td>{a.matricula}</td>
              <td>{a.proprietarioNome}</td>
              <td className="acoes">
                {agente && (
                  <>
                    <Link to={`/automoveis/${a._id}/editar`}>Editar</Link>
                    <button onClick={() => excluir(a._id)}>Excluir</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
