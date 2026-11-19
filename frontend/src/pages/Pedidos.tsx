import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensagem } from "../api";
import { useAuth } from "../auth";
import { Erro } from "../components/Campo";
import { Pedido } from "../types";

export default function Pedidos() {
  const { user } = useAuth();
  const cliente = user?.perfil === "cliente";
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(
    () =>
      api
        .get<Pedido[]>(
          `/pedidos${filtro ? `?status=${encodeURIComponent(filtro)}` : ""}`,
        )
        .then(setPedidos)
        .catch((e) => setErro(mensagem(e))),
    [filtro],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const acao = async (url: string, confirmacao?: string) => {
    if (confirmacao && !confirm(confirmacao)) return;
    try {
      await api.post(url);
      setErro(null);
      await carregar();
    } catch (e) {
      setErro(mensagem(e));
    }
  };

  return (
    <>
      <h2>Pedidos de aluguel</h2>
      {cliente ? (
        <p>
          <Link to="/pedidos/novo">+ Novo pedido</Link>
        </p>
      ) : (
        <p>
          Filtrar:{" "}
          <button className="link" onClick={() => setFiltro("")}>
            Todos
          </button>{" "}
          |{" "}
          <button className="link" onClick={() => setFiltro("Em análise")}>
            Em análise
          </button>
        </p>
      )}
      <Erro texto={erro} />
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Automóvel</th>
            <th>Período</th>
            <th>Criado em</th>
            <th>Status</th>
            <th>Avaliações / crédito</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p._id}>
              <td>{p.clienteNome}</td>
              <td>{p.carro}</td>
              <td>
                {p.inicio} → {p.fim}
              </td>
              <td>{p.criadoEm.slice(0, 10)}</td>
              <td>
                <b>{p.status}</b>
              </td>
              <td>
                {p.avaliacoes.map((a) => (
                  <div key={a._id}>
                    {a.agenteNome} — {a.parecer} ({a.data.slice(0, 10)}):{" "}
                    {a.observacao}
                  </div>
                ))}
                {p.contrato && (
                  <div>
                    Crédito: R$ {p.contrato.valor} em {p.contrato.prazo} meses (
                    {p.contrato.situacao})
                  </div>
                )}
              </td>
              <td className="acoes">
                {cliente ? (
                  <>
                    {p.status === "Em análise" && (
                      <Link to={`/pedidos/${p._id}/editar`}>Editar</Link>
                    )}
                    {["Em análise", "Aprovado"].includes(p.status) && (
                      <button
                        onClick={() =>
                          acao(`/pedidos/${p._id}/cancelar`, "Cancelar pedido?")
                        }
                      >
                        Cancelar
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {p.status === "Em análise" && (
                      <Link to={`/pedidos/${p._id}/avaliar`}>Avaliar</Link>
                    )}
                    {p.status === "Aprovado" && (
                      <button
                        onClick={() => acao(`/pedidos/${p._id}/executar`)}
                      >
                        Iniciar contrato
                      </button>
                    )}
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
