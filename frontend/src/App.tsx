import { Navigate, Route, Routes } from "react-router-dom";
import { Protegida, useAuth } from "./auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import ClienteForm from "./pages/ClienteForm";
import Clientes from "./pages/Clientes";
import Agentes from "./pages/Agentes";
import AgenteForm from "./pages/AgenteForm";
import Automoveis from "./pages/Automoveis";
import AutomovelForm from "./pages/AutomovelForm";
import Pedidos from "./pages/Pedidos";
import PedidoForm from "./pages/PedidoForm";
import Avaliar from "./pages/Avaliar";

function Inicio() {
  const { user, carregando } = useAuth();

  if (carregando) return <p>Carregando...</p>;

  return <Navigate to={user ? "/pedidos" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<ClienteForm />} />

        <Route
          path="/pedidos"
          element={
            <Protegida>
              <Pedidos />
            </Protegida>
          }
        />
        <Route
          path="/pedidos/novo"
          element={
            <Protegida perfil="cliente">
              <PedidoForm />
            </Protegida>
          }
        />
        <Route
          path="/pedidos/:id/editar"
          element={
            <Protegida perfil="cliente">
              <PedidoForm />
            </Protegida>
          }
        />
        <Route
          path="/pedidos/:id/avaliar"
          element={
            <Protegida perfil="agente">
              <Avaliar />
            </Protegida>
          }
        />

        <Route
          path="/automoveis"
          element={
            <Protegida>
              <Automoveis />
            </Protegida>
          }
        />
        <Route
          path="/automoveis/novo"
          element={
            <Protegida perfil="agente">
              <AutomovelForm />
            </Protegida>
          }
        />
        <Route
          path="/automoveis/:id/editar"
          element={
            <Protegida perfil="agente">
              <AutomovelForm />
            </Protegida>
          }
        />

        <Route
          path="/clientes"
          element={
            <Protegida>
              <Clientes />
            </Protegida>
          }
        />
        <Route
          path="/clientes/:id/editar"
          element={
            <Protegida perfil="cliente">
              <ClienteForm />
            </Protegida>
          }
        />

        <Route
          path="/agentes"
          element={
            <Protegida perfil="agente">
              <Agentes />
            </Protegida>
          }
        />
        <Route
          path="/agentes/novo"
          element={
            <Protegida perfil="agente">
              <AgenteForm />
            </Protegida>
          }
        />
        <Route
          path="/agentes/:id/editar"
          element={
            <Protegida perfil="agente">
              <AgenteForm />
            </Protegida>
          }
        />

        <Route path="*" element={<Inicio />} />
      </Route>
    </Routes>
  );
}
