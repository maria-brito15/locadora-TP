import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, mensagem } from "../api";
import { Campo, Erro, Formulario } from "../components/Campo";
import { Automovel } from "../types";

export default function AutomovelForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [f, setF] = useState({
    marca: "",
    modelo: "",
    ano: "",
    placa: "",
    matricula: "",
    proprietario: "",
  });
  const [donos, setDonos] = useState<{ v: string; t: string }[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    api
      .get<{ v: string; t: string }[]>("/automoveis/donos")
      .then((d) => ativo && setDonos(d))
      .catch((e) => setErro(mensagem(e)));
    if (!id) return;
    api
      .get<Automovel>(`/automoveis/${id}`)
      .then(
        (a) =>
          ativo &&
          setF({
            marca: a.marca,
            modelo: a.modelo,
            ano: String(a.ano),
            placa: a.placa,
            matricula: a.matricula,
            proprietario: a.proprietario ?? "",
          }),
      )
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
      if (id) await api.put(`/automoveis/${id}`, f);
      else await api.post("/automoveis", f);
      navigate("/automoveis");
    } catch (e) {
      setErro(mensagem(e));
    }
  };

  return (
    <>
      <h2>{id ? "Editar automóvel" : "Novo automóvel"}</h2>
      <Erro texto={erro} />
      <Formulario onSubmit={enviar}>
        <Campo rotulo="Marca" {...campo("marca")} required />
        <Campo rotulo="Modelo" {...campo("modelo")} required />
        <Campo rotulo="Ano" type="number" {...campo("ano")} required />
        <Campo rotulo="Placa" {...campo("placa")} required />
        <Campo
          rotulo="Matrícula / identificador"
          {...campo("matricula")}
          required
        />
        <label>
          Proprietário atual
          <select
            value={f.proprietario}
            onChange={(e) => setF({ ...f, proprietario: e.target.value })}
            required
          >
            <option value="">Selecione...</option>
            {donos.map((d) => (
              <option key={d.v} value={d.v}>
                {d.t}
              </option>
            ))}
          </select>
        </label>
        <button>Salvar</button>
      </Formulario>
    </>
  );
}
