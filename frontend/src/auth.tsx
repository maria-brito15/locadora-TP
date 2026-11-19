import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Navigate } from "react-router-dom";
import { api } from "./api";
import { Perfil, User } from "./types";

interface AuthCtx {
  user: User | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  recarregar: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = async () => {
    const r = await api.get<{ user: User | null }>("/me");

    setUser(r.user);
  };

  useEffect(() => {
    recarregar().finally(() => setCarregando(false));
  }, []);

  const entrar = async (email: string, senha: string) => {
    const r = await api.post<{ user: User }>("/login", { email, senha });

    setUser(r.user);
  };
  const sair = async () => {
    await api.post("/logout");
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, carregando, entrar, sair, recarregar }}>
      {children}
    </Ctx.Provider>
  );
}

export function Protegida({
  perfil,
  children,
}: {
  perfil?: Perfil;
  children: ReactNode;
}) {
  const { user, carregando } = useAuth();

  if (carregando) return <p>Carregando...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (perfil && user.perfil !== perfil)
    return <Navigate to="/pedidos" replace />;

  return <>{children}</>;
}
