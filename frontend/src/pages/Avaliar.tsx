import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, mensagem } from "../api";
import { useAuth } from "../auth";
import { Campo, Erro, Formulario } from "../components/Campo";
import { Pedido } from "../types";

export default function Avaliar() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [f, setF] = useState({
    parecer: "aprovado",
    observacao: "",
    valor: "",
    prazo: "",
    situacao: "Concedido",
  });
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Pedido>(`/pedidos/${id}`)
      .then((p) => {
        if (p.status !== "Em análise") {
          setErro("Só pedidos em análise podem ser avaliados");
        }
        setPedido(p);
      })
      .catch((e) => setErro(mensagem(e)));
  }, [id]);

  const enviar = async () => {
    try {
      await api.post(`/pedidos/${id}/avaliar`, f);
      navigate("/pedidos");
    } catch (e) {
      setErro(mensagem(e));
    }
  };

  return (
    <>
      <h2>Avaliação financeira</h2>
      <Erro texto={erro} />
      {pedido && (
        <p>
          <b>Cliente:</b> {pedido.clienteNome} · <b>Automóvel:</b>{" "}
          {pedido.carro} · <b>Período:</b> {pedido.inicio} a {pedido.fim}
        </p>
      )}
      <Formulario onSubmit={enviar}>
        <label>
          Parecer
          <select
            value={f.parecer}
            onChange={(e) => setF({ ...f, parecer: e.target.value })}
          >
            <option value="aprovado">Aprovado</option>
            <option value="reprovado">Reprovado</option>
          </select>
        </label>
        <label>
          Observação / justificativa
          <textarea
            rows={3}
            value={f.observacao}
            onChange={(e) => setF({ ...f, observacao: e.target.value })}
            required
          />
        </label>
        {user?.tipoAgente === "banco" && (
          <>
            <h4>Contrato de crédito (opcional, apenas se aprovado)</h4>
            <Campo
              rotulo="Valor financiado (R$)"
              type="number"
              step="0.01"
              min="0"
              value={f.valor}
              onChange={(e) => setF({ ...f, valor: e.target.value })}
            />
            <Campo
              rotulo="Prazo (meses)"
              type="number"
              min="1"
              value={f.prazo}
              onChange={(e) => setF({ ...f, prazo: e.target.value })}
            />
            <Campo
              rotulo="Situação do crédito"
              value={f.situacao}
              onChange={(e) => setF({ ...f, situacao: e.target.value })}
            />
          </>
        )}
        <button>Registrar avaliação</button>
      </Formulario>
    </>
  );
}
