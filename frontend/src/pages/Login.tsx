import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { mensagem } from "../api";
import { Campo, Erro, Formulario } from "../components/Campo";

export default function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async () => {
    try {
      await entrar(email, senha);
      navigate("/pedidos");
    } catch (e) {
      setErro(mensagem(e));
    }
  };

  return (
    <>
      <h2>Entrar</h2>
      <Erro texto={erro} />
      <Formulario onSubmit={enviar}>
        <Campo
          rotulo="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Campo
          rotulo="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button>Entrar</button>
      </Formulario>
      <p>
        <small>
          Demo (após <code>npm run seed</code>, senha 123456): cliente@demo.com
          · banco@demo.com · empresa@demo.com
        </small>
      </p>
    </>
  );
}
