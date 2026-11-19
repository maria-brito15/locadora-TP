# Diagrama de Pacotes (visão lógica)

```mermaid
flowchart TB
  subgraph Apresentacao["View (frontend/src)"]
    V["React: pages, components, auth, api"]
  end

  subgraph Controle["Controller (src/controllers + src/middleware.ts)"]
    CAuth[auth]
    CCli[clientes]
    CAg[agentes]
    CAut[automoveis]
    CPed[pedidos]
    MW["middleware: logado, soAgente, soCliente"]
  end

  subgraph Modelo["Model (src/models.ts)"]
    M["Entidades e regras: Usuario, Cliente, Agente, Automovel, Pedido, Avaliacao, Contrato"]
  end

  subgraph Persistencia["Persistência (src/restheart.ts)"]
    R["Repositório genérico REST"]
  end

  subgraph Externo["Infraestrutura (docker-compose.yml)"]
    RH[RESTHeart]
    DB[(MongoDB)]
  end

  V -->|"HTTP JSON (/api)"| Servidor
  Servidor["src/server.ts"] --> Controle
  Controle --> MW
  Controle --> Modelo
  Modelo --> Persistencia
  Persistencia -->|HTTP| RH
  RH --> DB
```

| Pacote | Responsabilidade |
|---|---|
| View | Telas React (SPA) que consomem a API JSON |
| Controller | Rotas `/api`, validação, autorização e regras de negócio |
| Model | Entidades, tipos e coleções |
| Persistência | Acesso ao MongoDB via API REST do RESTHeart |
