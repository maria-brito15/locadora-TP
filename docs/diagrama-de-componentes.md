# Diagrama de Componentes

```mermaid
flowchart LR
  subgraph SPA["Front-end React (Vite, porta 5173)"]
    Router["React Router + AuthProvider"]
    Paginas["Páginas: Login, Clientes, Agentes, Automóveis, Pedidos, Avaliar"]
    Api["api.ts (fetch /api)"]
  end

  subgraph App["API Node.js (Express, porta 3000)"]
    Sessao["express-session"]
    Auth["Componente Autenticação (auth + bcryptjs)"]
    Clientes["Componente Clientes"]
    Agentes["Componente Agentes"]
    Automoveis["Componente Automóveis"]
    Pedidos["Componente Pedidos e Avaliações"]
    Repo["Repositório RESTHeart (restheart.ts)"]
  end

  subgraph Infra["Docker Compose"]
    RH["RESTHeart (porta 8080)"]
    Mongo[("MongoDB 7")]
  end

  Router --> Paginas
  Paginas --> Api
  Api -->|"HTTP JSON (proxy /api)"| Sessao
  Sessao --> Auth
  Sessao --> Clientes
  Sessao --> Agentes
  Sessao --> Automoveis
  Sessao --> Pedidos
  Auth --> Repo
  Clientes --> Repo
  Agentes --> Repo
  Automoveis --> Repo
  Pedidos --> Repo
  Repo -->|REST/JSON| RH
  RH --> Mongo
```

| Componente | Interface oferecida | Depende de |
|---|---|---|
| Front-end React | Telas e rotas do navegador | API `/api` |
| Autenticação | `POST /api/login`, `POST /api/logout`, `GET /api/me` | Repositório (usuários, clientes, agentes) |
| Clientes | `POST /api/registro`, `/api/clientes` | Repositório |
| Agentes | `/api/agentes` | Repositório |
| Automóveis | `/api/automoveis` | Repositório |
| Pedidos e Avaliações | `/api/pedidos`, `/api/pedidos/:id/avaliar`, `/api/pedidos/:id/executar` | Repositório |
| Repositório RESTHeart | CRUD genérico por coleção | RESTHeart / MongoDB |
