import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Layout() {
  const { user, sair } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await sair();
    navigate("/login");
  };

  return (
    <>
      <header className="topo">
        <div className="topo-in">
          <span className="marca">Locadora</span>
          <nav>
            {user ? (
              <>
                <Link to="/pedidos">Pedidos</Link>
                <Link to="/automoveis">Automóveis</Link>
                <Link to="/clientes">Clientes</Link>
                {user.perfil === "agente" && <Link to="/agentes">Agentes</Link>}
                <button className="link" onClick={logout}>
                  Sair ({user.nome} · {user.perfil})
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Entrar</Link>
                <Link to="/registro">Cadastrar-se (cliente)</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
