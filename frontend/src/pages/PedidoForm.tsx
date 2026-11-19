import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, mensagem } from "../api";
import { Campo, Erro, Formulario } from "../components/Campo";
import { Automovel, Pedido } from "../types";

export default function PedidoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [autos, setAutos] = useState<Automovel[]>([]);
  const [f, setF] = useState({ automovelId: "", inicio: "", fim: "" });
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    api
      .get<Automovel[]>("/automoveis")
      .then((a) => ativo && setAutos(a))
      .catch((e) => setErro(mensagem(e)));
    if (!id) return;
    api
      .get<Pedido>(`/pedidos/${id}`)
      .then(
        (p) =>
          ativo &&
          setF({ automovelId: p.automovelId, inicio: p.inicio, fim: p.fim }),
      )
      .catch((e) => setErro(mensagem(e)));

    return () => {
      ativo = false;
    };
  }, [id]);

  const enviar = async () => {
    try {
      if (id) await api.put(`/pedidos/${id}`, f);
      else await api.post("/pedidos", f);
      navigate("/pedidos");
    } catch (e) {
      setErro(mensagem(e));
    }
  };

  return (
    <>
      <h2>{id ? "Editar pedido" : "Novo pedido de aluguel"}</h2>
      <Erro texto={erro} />
      <Formulario onSubmit={enviar}>
        <label>
          Automóvel
          <select
            value={f.automovelId}
            onChange={(e) => setF({ ...f, automovelId: e.target.value })}
            required
          >
            <option value="">Selecione...</option>
            {autos.map((a) => (
              <option key={a._id} value={a._id}>
                {a.marca} {a.modelo} {a.ano} ({a.placa})
              </option>
            ))}
          </select>
        </label>
        <Campo
          rotulo="Início"
          type="date"
          value={f.inicio}
          onChange={(e) => setF({ ...f, inicio: e.target.value })}
          required
        />
        <Campo
          rotulo="Fim"
          type="date"
          value={f.fim}
          onChange={(e) => setF({ ...f, fim: e.target.value })}
          required
        />
        <button>Salvar</button>
      </Formulario>
    </>
  );
}
