# Diagrama de Casos de Uso

```mermaid
flowchart LR
  Cliente([Cliente])
  Agente([Agente])

  subgraph Sistema["Sistema Web de Aluguel de Automóveis"]
    UC1(Cadastrar-se)
    UC2(Efetuar login / logout)
    UC3(Consultar e editar próprio cadastro)
    UC4(Excluir próprio cadastro)
    UC5(Criar pedido de aluguel)
    UC6(Consultar pedidos e status)
    UC7(Editar pedido em análise)
    UC8(Cancelar pedido)
    UC9(Consultar automóveis)
    UC10(Gerenciar automóveis)
    UC11(Gerenciar agentes)
    UC12(Consultar clientes)
    UC13(Consultar pedidos pendentes)
    UC14(Avaliar financeiramente pedido)
    UC15(Registrar contrato de crédito)
    UC16(Colocar pedido em execução)
  end

  Cliente --- UC1
  Cliente --- UC2
  Cliente --- UC3
  Cliente --- UC4
  Cliente --- UC5
  Cliente --- UC6
  Cliente --- UC7
  Cliente --- UC8
  Cliente --- UC9

  Agente --- UC2
  Agente --- UC9
  Agente --- UC10
  Agente --- UC11
  Agente --- UC12
  Agente --- UC13
  Agente --- UC14
  Agente --- UC16

  UC14 -. "«extend» (somente banco)" .-> UC15
  UC5 -. "«include»" .-> UC2
  UC14 -. "«include»" .-> UC13
```

## Descrição resumida

| Caso de uso | Ator | Regra principal |
|---|---|---|
| Cadastrar-se | Cliente | Até 3 vínculos empregatícios; CPF (11 dígitos) e e-mail únicos |
| Efetuar login / logout | Cliente, Agente | Apenas usuários cadastrados acessam |
| Criar / editar / cancelar pedido | Cliente | Apenas os próprios pedidos; edição só em análise |
| Consultar pedidos e status | Cliente | Vê somente os próprios pedidos e avaliações |
| Gerenciar automóveis | Agente | Proprietário obrigatório: cliente, empresa ou banco; não exclui automóvel com pedidos |
| Gerenciar agentes | Agente | Tipo empresa ou banco; não exclui agente com automóveis, avaliações ou contratos |
| Avaliar financeiramente pedido | Agente | Parecer aprovado/reprovado com justificativa; registra o agente; pedido cancelado não pode ser aprovado |
| Registrar contrato de crédito | Agente (banco) | Opcional na aprovação; apenas agente do tipo banco |
| Colocar pedido em execução | Agente | Somente pedidos aprovados |
