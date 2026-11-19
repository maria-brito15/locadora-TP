import express from "express";
import session from "express-session";
import path from "path";
import { existsSync } from "fs";
import { init } from "./restheart";
import { erroGeral } from "./middleware";
import auth from "./controllers/auth";
import clientes from "./controllers/clientes";
import agentes from "./controllers/agentes";
import automoveis from "./controllers/automoveis";
import pedidos from "./controllers/pedidos";

const segredo = process.env.SESSION_SECRET;

if (!segredo && process.env.NODE_ENV === "production") {
  console.error("Defina SESSION_SECRET para executar em produção.");
  process.exit(1);
}

const app = express();
const dist = path.join(process.cwd(), "frontend", "dist");

app.use(express.json());
app.use(
  session({
    secret: segredo ?? "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" },
  }),
);
app.use("/api", auth, clientes, agentes, automoveis, pedidos);
app.use("/api", (_req, res) =>
  res.status(404).json({ erro: "Rota não encontrada" }),
);
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*splat}", (_req, res) =>
    res.sendFile(path.join(dist, "index.html")),
  );
}
app.use(erroGeral);

const port = Number(process.env.PORT ?? 3000);

init()
  .then(() =>
    app.listen(port, () => console.log(`API em http://localhost:${port}/api`)),
  )
  .catch((e) => {
    console.error("Falha ao conectar no RESTHeart (docker compose up -d?)", e);
    process.exit(1);
  });
