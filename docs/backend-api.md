# API REST — Backend (Checkpoint 1)

API NestJS do sistema de comandas e pedidos. Todas as rotas ficam sob o prefixo **`/api`**
(ex.: `http://localhost:3000/api/mesas`). Nesta etapa não há autenticação; ela será
adicionada com JWT em etapa futura (o modelo `Usuario` com `perfil` já existe).

Instruções de instalação e execução: [`backend/README.md`](../backend/README.md).

## Convenções

| Item | Convenção |
|---|---|
| Formato | JSON (`Content-Type: application/json`) |
| Datas | ISO 8601 em UTC (`2026-10-01T23:28:58.860Z`) |
| Valores monetários | **string** com 2 casas (`"64.90"`), para não perder precisão. Na entrada (`preco`), envie número: `64.9` |
| Ids | inteiros; id não numérico na URL → `400` |
| Campos extras no corpo | rejeitados com `400` |

### Erros

Todas as respostas de erro seguem o formato do NestJS:

```json
{ "statusCode": 409, "error": "Conflict", "message": "Transição inválida: o pedido 13 está ENTREGUE e não pode ir para EM_PREPARO. ENTREGUE é um status final." }
```

| Status | Quando |
|---|---|
| `400 Bad Request` | Corpo/query inválido (validação dos DTOs). `message` é uma lista |
| `404 Not Found` | Mesa, comanda, pedido, produto, categoria ou usuário inexistente |
| `409 Conflict` | Operação incompatível com o estado atual (mesa ocupada, transição de status inválida, fechar com pedido pendente, nome/número duplicado) |
| `422 Unprocessable Entity` | Dados válidos, mas recusados pela regra (produto indisponível, mesa desativada, usuário inativo ou com perfil inadequado) |

## Modelo de dados

```
Usuario (perfil: ADMIN | GERENTE | GARCOM | COZINHA)
Mesa (status: LIVRE | OCUPADA) 1───* Comanda (status: ABERTA | FECHAMENTO_SOLICITADO | FECHADA | CANCELADA)
                                       1───* Pedido (status: PENDENTE | EM_PREPARO | PRONTO | ENTREGUE | CANCELADO)
                                                1───* ItemPedido *───1 Produto *───1 Categoria
```

`Comanda.garcomId` e `Pedido.criadoPorId` referenciam `Usuario` e são opcionais nesta etapa
(com JWT passarão a vir do token).

## Regras de negócio

**Mesas**
- O status da mesa não é editado diretamente: abrir comanda → `OCUPADA`; fechar ou cancelar a comanda → `LIVRE`.
- Mesa ocupada não pode ser desativada.

**Comandas**
- Só abre em mesa `LIVRE` e ativa. Uma mesa tem **no máximo uma comanda ativa**
  (`ABERTA` ou `FECHAMENTO_SOLICITADO`); isso também é garantido por índice único parcial no banco.
- `ABERTA → FECHAMENTO_SOLICITADO` (garçom pede a conta). Depois disso não entram novos pedidos.
- **Fechar** (de `ABERTA` ou `FECHAMENTO_SOLICITADO`) exige todos os pedidos `ENTREGUE` ou
  `CANCELADO`. O `total` é calculado com os pedidos entregues, gravado na comanda, e a mesa volta a `LIVRE`.
- **Cancelar** só é permitido se não houver pedidos ou se todos estiverem `CANCELADO`
  (comanda aberta por engano). A mesa volta a `LIVRE`.

**Pedidos**
- Só em comanda `ABERTA`, com 1 a 50 itens, quantidade de 1 a 99 por item.
- Produtos precisam existir e estar ativos, disponíveis e em categoria ativa.
- O preço do produto é **copiado para o item** no momento do pedido: mudar o cardápio depois não altera pedidos já lançados.
- Máquina de estados (sem pular etapas nem voltar):

```
PENDENTE ──► EM_PREPARO ──► PRONTO ──► ENTREGUE
    └──────► CANCELADO        (cancelamento só antes do preparo)
```

Cada transição registra a data/hora correspondente (`iniciadoEm`, `prontoEm`, `entregueEm`, `canceladoEm`).

**Concorrência:** abrir comanda, mudar status de pedido, lançar pedido e fechar/cancelar comanda
são operações atômicas. Requisições simultâneas conflitantes resultam em uma aceita e as demais `409`,
sem estados inconsistentes (ex.: um pedido lançado no mesmo instante do fechamento é aceito antes
— e o fechamento é recusado — ou recusado depois).

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api` | Status da API |
| **Mesas** | | |
| GET | `/api/mesas` | Lista mesas ativas com `comandaAtiva`. Query: `status=LIVRE\|OCUPADA`, `incluirInativas=true` |
| GET | `/api/mesas/:id` | Detalhe da mesa |
| POST | `/api/mesas` | Cria mesa `{ numero, capacidade? }` |
| PATCH | `/api/mesas/:id` | Altera `numero`, `capacidade`, `ativa` |
| **Categorias** | | |
| GET | `/api/categorias` | Lista categorias ativas. Query: `incluirInativas=true` |
| GET | `/api/categorias/:id` | Detalhe |
| POST | `/api/categorias` | Cria `{ nome, ordem? }` |
| PATCH | `/api/categorias/:id` | Altera `nome`, `ordem`, `ativa` |
| **Produtos** | | |
| GET | `/api/produtos` | Cardápio (ativos, em categoria ativa). Query: `categoriaId`, `disponivel=true\|false`, `incluirInativos=true` |
| GET | `/api/produtos/:id` | Detalhe |
| POST | `/api/produtos` | Cria `{ nome, descricao?, preco, categoriaId, disponivel? }` |
| PATCH | `/api/produtos/:id` | Altera qualquer campo, inclusive `disponivel` e `ativo` (exclusão lógica) |
| **Comandas** | | |
| POST | `/api/comandas` | Abre comanda `{ mesaId, garcomId?, nomeCliente?, observacao? }` |
| GET | `/api/comandas` | Lista (mais recentes primeiro). Query: `status=ABERTA,FECHAMENTO_SOLICITADO`, `mesaId` |
| GET | `/api/comandas/:id` | Detalhe com pedidos, itens, subtotais e `resumo` |
| POST | `/api/comandas/:id/solicitar-fechamento` | `ABERTA → FECHAMENTO_SOLICITADO` |
| POST | `/api/comandas/:id/fechar` | Fecha, grava `total` e libera a mesa |
| POST | `/api/comandas/:id/cancelar` | Cancela comanda sem pedidos ativos e libera a mesa |
| **Pedidos** | | |
| POST | `/api/pedidos` | Lança pedido `{ comandaId, criadoPorId?, observacao?, itens: [{ produtoId, quantidade, observacao? }] }` |
| GET | `/api/pedidos` | Lista (mais antigos primeiro). Query: `status` (um ou vários: `status=PRONTO` ou `status=PENDENTE,EM_PREPARO`), `comandaId`, `mesaId` |
| GET | `/api/pedidos/cozinha` | Fila da cozinha: `PENDENTE` e `EM_PREPARO`, do mais antigo ao mais novo |
| GET | `/api/pedidos/:id` | Detalhe |
| PATCH | `/api/pedidos/:id/status` | Muda status `{ status }` seguindo a máquina de estados |
| **Usuários** | | |
| GET | `/api/usuarios` | Lista usuários ativos (sem senha). Query: `perfil`, `incluirInativos=true` |
| GET | `/api/usuarios/:id` | Detalhe |
| POST | `/api/usuarios` | Cria `{ nome, email, senha, perfil }` (senha gravada com hash scrypt) |
| PATCH | `/api/usuarios/:id` | Altera dados, `senha` ou `ativo` |

Pedidos prontos para o garçom buscar: `GET /api/pedidos?status=PRONTO` (ou `&mesaId=2`).

## Fluxo principal do MVP passo a passo

Os ids abaixo são os do banco recém-populado pelo seed (`npx prisma db seed`): mesas 1–10,
produtos 1–11, garçom João = usuário 3. Ajuste conforme seus dados.

O mesmo fluxo é executado automaticamente por `npm run fluxo:mvp` (com a API rodando).

### 1. Listar mesas

`GET /api/mesas`

```json
[
  {
    "id": 2, "numero": 2, "capacidade": 4, "status": "LIVRE", "ativa": true,
    "criadoEm": "2026-10-01T23:27:49.059Z", "atualizadoEm": "2026-10-01T23:28:36.305Z",
    "comandaAtiva": null
  }
]
```

### 2. Abrir uma comanda

`POST /api/comandas`

```json
{ "mesaId": 2, "garcomId": 3, "nomeCliente": "Ana" }
```

Resposta `201` (mesmo formato do passo 3).

### 3. Consultar a comanda

`GET /api/comandas/4`

```json
{
  "id": 4, "mesaId": 2, "garcomId": 3, "status": "ABERTA", "nomeCliente": "Ana",
  "observacao": null, "total": null,
  "abertaEm": "2026-10-01T23:28:58.860Z", "fechamentoSolicitadoEm": null,
  "fechadaEm": null, "canceladaEm": null, "atualizadoEm": "2026-10-01T23:28:58.860Z",
  "mesa": { "id": 2, "numero": 2, "status": "OCUPADA" },
  "garcom": { "id": 3, "nome": "Garçom João", "perfil": "GARCOM" },
  "pedidos": [],
  "resumo": {
    "quantidadePedidos": 0, "pedidosPendentesDeEntrega": 0,
    "valorEntregue": "0.00", "valorEmAndamento": "0.00", "valorPrevisto": "0.00",
    "podeFechar": true
  }
}
```

### 4. Listar produtos

`GET /api/produtos?disponivel=true`

```json
[
  {
    "id": 1, "nome": "Batata frita", "descricao": "Porção de batata frita crocante",
    "preco": "29.90", "categoriaId": 1, "disponivel": true, "ativo": true,
    "criadoEm": "2026-10-01T23:27:49.092Z", "atualizadoEm": "2026-10-01T23:27:51.237Z",
    "categoria": { "id": 1, "nome": "Entradas" }
  }
]
```

### 5. Criar um pedido com itens

`POST /api/pedidos`

```json
{
  "comandaId": 4,
  "criadoPorId": 3,
  "itens": [
    { "produtoId": 4, "quantidade": 2, "observacao": "sem cebola" },
    { "produtoId": 7, "quantidade": 2 }
  ]
}
```

Resposta `201`:

```json
{
  "id": 13, "comandaId": 4, "criadoPorId": 3, "status": "PENDENTE", "observacao": null,
  "criadoEm": "2026-10-01T23:28:58.919Z", "atualizadoEm": "2026-10-01T23:28:58.919Z",
  "iniciadoEm": null, "prontoEm": null, "entregueEm": null, "canceladoEm": null,
  "itens": [
    {
      "id": 14, "pedidoId": 13, "produtoId": 4, "quantidade": 2,
      "precoUnitario": "64.90", "observacao": "sem cebola",
      "produto": { "id": 4, "nome": "Filé à parmegiana" }, "subtotal": "129.80"
    },
    {
      "id": 15, "pedidoId": 13, "produtoId": 7, "quantidade": 2,
      "precoUnitario": "7.00", "observacao": null,
      "produto": { "id": 7, "nome": "Refrigerante lata" }, "subtotal": "14.00"
    }
  ],
  "criadoPor": { "id": 3, "nome": "Garçom João", "perfil": "GARCOM" },
  "comanda": { "id": 4, "status": "ABERTA", "nomeCliente": "Ana", "mesa": { "id": 2, "numero": 2 } },
  "total": "143.80"
}
```

### 6. Consultar pedidos da cozinha

`GET /api/pedidos/cozinha` — lista no mesmo formato do passo 5, só com `PENDENTE` e `EM_PREPARO`.

### 7. PENDENTE → EM_PREPARO

`PATCH /api/pedidos/13/status`

```json
{ "status": "EM_PREPARO" }
```

### 8. EM_PREPARO → PRONTO

`PATCH /api/pedidos/13/status`

```json
{ "status": "PRONTO" }
```

### 9. Marcar como ENTREGUE

`PATCH /api/pedidos/13/status`

```json
{ "status": "ENTREGUE" }
```

Resposta (trecho):

```json
{
  "id": 13, "status": "ENTREGUE",
  "iniciadoEm": "2026-10-01T23:28:58.986Z",
  "prontoEm": "2026-10-01T23:28:59.019Z",
  "entregueEm": "2026-10-01T23:28:59.042Z",
  "total": "143.80"
}
```

### 10. Solicitar fechamento

`POST /api/comandas/4/solicitar-fechamento` (sem corpo)

Resposta (trecho):

```json
{
  "status": "FECHAMENTO_SOLICITADO",
  "fechamentoSolicitadoEm": "2026-10-01T23:28:59.052Z",
  "resumo": {
    "quantidadePedidos": 1, "pedidosPendentesDeEntrega": 0,
    "valorEntregue": "143.80", "valorEmAndamento": "0.00", "valorPrevisto": "143.80",
    "podeFechar": true
  }
}
```

### 11. Fechar a comanda

`POST /api/comandas/4/fechar` (sem corpo)

Resposta (trecho):

```json
{
  "id": 4, "status": "FECHADA", "total": "143.80",
  "fechadaEm": "2026-10-01T23:28:59.066Z",
  "mesa": { "id": 2, "numero": 2, "status": "LIVRE" }
}
```

### 12. Verificar que a mesa voltou para LIVRE

`GET /api/mesas/2`

```json
{
  "id": 2, "numero": 2, "capacidade": 4, "status": "LIVRE", "ativa": true,
  "criadoEm": "2026-10-01T23:27:49.059Z", "atualizadoEm": "2026-10-01T23:28:59.068Z",
  "comandaAtiva": null
}
```

## Exemplos de recusa (regras de negócio)

| Requisição | Resultado |
|---|---|
| `POST /api/comandas` `{ "mesaId": 2 }` com a mesa já ocupada | `409` "A mesa 2 já está ocupada (comanda 4)." |
| `PATCH /api/pedidos/13/status` `{ "status": "PRONTO" }` com o pedido `PENDENTE` | `409` "Transição inválida ... Próximos status permitidos: EM_PREPARO, CANCELADO." |
| `POST /api/comandas/4/fechar` com pedido em preparo | `409` "A comanda 4 tem pedido(s) não entregue(s): #13 (EM_PREPARO)..." |
| `POST /api/pedidos` após solicitar fechamento | `409` "...o fechamento já foi solicitado; não é possível lançar novos pedidos." |
| `POST /api/pedidos` `{ "comandaId": 4, "itens": [] }` | `400` "O pedido deve ter pelo menos um item." |
| `POST /api/pedidos` com `produtoId` inexistente | `404` "Produto(s) não encontrado(s): 999." |
| `POST /api/pedidos` com produto `disponivel: false` | `422` "Produto(s) indisponível(is) no momento: ..." |
