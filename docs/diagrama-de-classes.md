# Diagrama de Classes

```mermaid
classDiagram
  class Usuario {
    +String email
    +String senha
    +Perfil perfil
    +String refId
  }
  class Cliente {
    +String nome
    +String cpf
    +String rg
    +String endereco
    +String profissao
  }
  class Emprego {
    +String entidade
    +Number rendimento
  }
  class Agente {
    +String nome
    +String cnpj
    +String endereco
    +TipoAgente tipo
  }
  class Automovel {
    +String marca
    +String modelo
    +Number ano
    +String placa
    +String matricula
    +ProprietarioTipo proprietarioTipo
    +String proprietarioId
  }
  class Pedido {
    +Date inicio
    +Date fim
    +Date criadoEm
    +Status status
  }
  class Avaliacao {
    +Date data
    +Parecer parecer
    +String observacao
  }
  class Contrato {
    +Number valor
    +Number prazo
    +String situacao
  }
  class Perfil {
    <<enumeration>>
    cliente
    agente
  }
  class TipoAgente {
    <<enumeration>>
    empresa
    banco
  }
  class Status {
    <<enumeration>>
    Em análise
    Aprovado
    Reprovado
    Cancelado
    Contrato em execução
  }
  class Parecer {
    <<enumeration>>
    aprovado
    reprovado
  }
  class ProprietarioTipo {
    <<enumeration>>
    cliente
    empresa
    banco
  }

  Usuario "1" --> "0..1" Cliente : refId (perfil cliente)
  Usuario "1" --> "0..1" Agente : refId (perfil agente)
  Usuario ..> Perfil
  Agente ..> TipoAgente
  Cliente "1" *-- "0..3" Emprego
  Cliente "1" --> "*" Pedido : solicita
  Pedido "*" --> "1" Automovel
  Pedido "*" --> "0..1" Agente : responsável
  Pedido "1" --> "0..*" Avaliacao
  Avaliacao "*" --> "1" Agente : realizada por
  Pedido "1" --> "0..1" Contrato
  Contrato "*" --> "1" Agente : banco concedente
  Automovel "*" --> "1" Cliente : proprietário (se cliente)
  Automovel "*" --> "1" Agente : proprietário (se empresa/banco)
  Pedido ..> Status
  Avaliacao ..> Parecer
  Automovel ..> ProprietarioTipo
```

## Regras de negócio refletidas no modelo

- `Cliente` possui no máximo 3 `Emprego`.
- `Contrato.bancoId` referencia somente `Agente` com `tipo = banco`.
- `Automovel` sempre possui `proprietarioTipo` e `proprietarioId`; o proprietário (`Cliente` ou `Agente`) não pode ser excluído enquanto possuir automóveis.
- `Avaliacao` sempre referencia o `Agente` que a realizou.
- `Cliente.cpf` é único e possui 11 dígitos.
- `Pedido` cancelado não pode receber `Avaliacao` aprovada nem ir para "Contrato em execução".
