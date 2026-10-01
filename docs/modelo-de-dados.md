# Modelo de dados e regras de negócio

Esquema definido em [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)
(PostgreSQL 18, Prisma 7). Tabelas e colunas usam `snake_case` no banco.

## Entidades

```
Usuario 1───* Comanda *───1 Mesa
                 │
                 1
                 │
                 *
              Pedido 1───* ItemPedido *───1 Produto *───1 Categoria
```

| Entidade     | Tabela         | Campos principais                                                                 |
| ------------ | -------------- | --------------------------------------------------------------------------------- |
| `Usuario`    | `usuarios`     | `nome`, `email` (único), `senhaHash`, `perfil`, `ativo`                            |
| `Mesa`       | `mesas`        | `numero` (único), `capacidade`, `status`                                          |
| `Categoria`  | `categorias`   | `nome` (único)                                                                    |
| `Produto`    | `produtos`     | `nome`, `descricao`, `preco` (decimal 10,2), `disponivel`, `categoriaId`          |
| `Comanda`    | `comandas`     | `mesaId`, `usuarioId?`, `nomeCliente?`, `status`, `total?`, `abertaEm`, `fechamentoSolicitadoEm?`, `fechadaEm?` |
| `Pedido`     | `pedidos`      | `comandaId`, `status`, `observacao?`, `createdAt`                                 |
| `ItemPedido` | `itens_pedido` | `pedidoId`, `produtoId`, `quantidade`, `precoUnitario` (decimal 10,2), `observacao?` |

## Enums

| Enum            | Valores                                                     |
| --------------- | ----------------------------------------------------------- |
| `Perfil`        | `GARCOM`, `COZINHA`, `GERENTE`                              |
| `StatusMesa`    | `LIVRE`, `OCUPADA`                                          |
| `StatusComanda` | `ABERTA`, `FECHAMENTO_SOLICITADO`, `FECHADA`                |
| `StatusPedido`  | `PENDENTE`, `EM_PREPARO`, `PRONTO`, `ENTREGUE`, `CANCELADO` |

## Regras de negócio

### Mesa

- O status da mesa não é editado diretamente: muda para `OCUPADA` ao abrir uma
  comanda e volta para `LIVRE` ao fechá-la.
- `numero` é único.

### Comanda

```
ABERTA ──solicitar-fechamento──▶ FECHAMENTO_SOLICITADO ──fechar──▶ FECHADA
```

- Só é possível abrir comanda em mesa `LIVRE`. A verificação e a ocupação da mesa
  são feitas em uma única atualização condicional, então duas requisições
  simultâneas para a mesma mesa nunca abrem duas comandas.
- `usuarioId` (garçom) é opcional; se informado, o usuário precisa existir e estar ativo.
- Pedidos só podem ser lançados em comanda `ABERTA`.
- Solicitar fechamento exige comanda `ABERTA` e nenhum pedido em andamento
  (`PENDENTE`, `EM_PREPARO` ou `PRONTO`).
- Fechar exige comanda `FECHAMENTO_SOLICITADO`. O total (soma dos itens de
  pedidos não cancelados) é gravado em `total` e a mesa volta para `LIVRE`.
- Lançar pedido, solicitar fechamento e fechar bloqueiam a linha da comanda
  (`SELECT ... FOR UPDATE`), evitando que um pedido entre enquanto a comanda é fechada.
- Enquanto não está fechada, a API devolve em `total` o valor parcial calculado.

### Pedido

```
PENDENTE ──▶ EM_PREPARO ──▶ PRONTO ──▶ ENTREGUE
    │
    └──▶ CANCELADO
```

- Deve ter ao menos 1 item (máx. 50); `quantidade` entre 1 e 100.
- Todos os produtos precisam existir e estar `disponivel`.
- O preço de cada item é copiado do produto no momento do pedido
  (`precoUnitario`), então alterações futuras de preço não mudam pedidos antigos.
- Somente as transições do diagrama são aceitas; `ENTREGUE` e `CANCELADO` são finais.
- A atualização de status é condicional ao status lido, então duas alterações
  concorrentes não sobrescrevem uma à outra.

### Usuário

- A senha é armazenada com bcrypt (`senhaHash`) e nunca é retornada pela API.
- E-mail único, normalizado para minúsculas.
