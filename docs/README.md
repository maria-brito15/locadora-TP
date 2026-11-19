# Documentação de Modelagem

| Documento | Sprint | Conteúdo |
|---|---|---|
| [casos-de-uso.md](casos-de-uso.md) | 1 | Diagrama de casos de uso |
| [historias-de-usuario.md](historias-de-usuario.md) | 1 | Histórias de usuário (cliente e agente) e máquina de estados do pedido |
| [diagrama-de-classes.md](diagrama-de-classes.md) | 1 | Diagrama de classes |
| [diagrama-de-pacotes.md](diagrama-de-pacotes.md) | 1 | Visão lógica em pacotes |
| [diagrama-de-componentes.md](diagrama-de-componentes.md) | 2 | Diagrama de componentes |

Os diagramas usam Mermaid e são renderizados automaticamente pelo GitHub.

## Evolução entre as sprints

Registrar abaixo as alterações feitas em cada sprint, com a data e o commit correspondente.

| Sprint | Alteração nos diagramas | Motivo |
|---|---|---|
| 1 | Versão inicial: casos de uso, histórias, classes e pacotes | Modelagem do domínio |
| 2 | Inclusão do diagrama de componentes; revisão conforme feedback | Estrutura MVC e persistência no MongoDB |
| 3 | Front-end migrado para React (SPA) consumindo API JSON; inclusão de `Pedido -> Agente (responsável)`, caso de uso "Colocar pedido em execução" e máquina de estados do pedido | Alinhamento com a implementação final |
| 3 (auditoria final) | Regras de integridade documentadas: CPF único, proprietário de automóvel e agente com vínculos não podem ser excluídos, automóvel com pedidos não pode ser excluído | Alinhamento dos diagramas/histórias com o código após a auditoria de pré-entrega |
