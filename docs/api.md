# API REST — Referência e roteiro de testes

Base URL (desenvolvimento): `http://localhost:3000`

Todas as requisições e respostas usam JSON (`Content-Type: application/json`).
Uma coleção pronta para importar no Postman, Insomnia ou Bruno está em
[`restaurante.postman_collection.json`](./restaurante.postman_collection.json).

## Convenções

- IDs são inteiros. Um ID não numérico na URL retorna `400`.
- Valores monetários (`preco`, `precoUnitario`, `subtotal`, `total`) são
  **strings com duas casas decimais** (ex.: `"64.90"`), para não perder precisão.
  Na entrada, `preco` é enviado como número (`64.9`).
- Datas no formato ISO 8601 (UTC).
- Campos desconhecidos no corpo da requisição são rejeitados (`400`).

### Formato de erro

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Mesa 3 não está livre (status atual: OCUPADA)"
}
```

Em erros de validação, `message` é uma lista:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["itens must contain at least 1 elements"]
}
```

| Status | Quando                                                                     |
| ------ | -------------------------------------------------------------------------- |
| `400`  | Corpo, parâmetro ou query inválidos                                        |
| `404`  | Recurso (ou recurso referenciado no corpo) não encontrado                  |
| `409`  | Conflito de estado (mesa ocupada, transição inválida, valor único repetido) |
| `422`  | Regra de negócio sobre o dado enviado (produto indisponível, usuário inativo) |

## Endpoints

### Mesas

| Método  | Rota          | Descrição                                                   |
| ------- | ------------- | ----------------------------------------------------------- |
| `GET`   | `/mesas`      | Lista mesas com `comandaAtiva`. Query: `status=LIVRE\|OCUPADA` |
| `GET`   | `/mesas/:id`  | Detalha uma mesa                                            |
| `POST`  | `/mesas`      | Cria mesa — `{ "numero": 11, "capacidade": 4 }`             |
| `PATCH` | `/mesas/:id`  | Altera `numero`/`capacidade` (o status é controlado pelas comandas) |

### Categorias

| Método  | Rota              | Descrição                                     |
| ------- | ----------------- | --------------------------------------------- |
| `GET`   | `/categorias`     | Lista categorias com a contagem de produtos   |
| `GET`   | `/categorias/:id` | Detalha a categoria com seus produtos         |
| `POST`  | `/categorias`     | Cria — `{ "nome": "Massas" }`                 |
| `PATCH` | `/categorias/:id` | Renomeia                                      |

### Produtos

| Método  | Rota            | Descrição                                                        |
| ------- | --------------- | ---------------------------------------------------------------- |
| `GET`   | `/produtos`     | Lista. Query: `categoriaId=2`, `disponivel=true\|false`          |
| `GET`   | `/produtos/:id` | Detalha                                                          |
| `POST`  | `/produtos`     | Cria (ver exemplo abaixo)                                        |
| `PATCH` | `/produtos/:id` | Altera qualquer campo, inclusive `preco` e `disponivel`          |

```json
{
  "nome": "Lasanha",
  "descricao": "Bolonhesa, 400 g",
  "preco": 52.9,
  "disponivel": true,
  "categoriaId": 2
}
```

### Usuários

| Método  | Rota            | Descrição                                                  |
| ------- | --------------- | ---------------------------------------------------------- |
| `GET`   | `/usuarios`     | Lista. Query: `perfil=GARCOM\|COZINHA\|GERENTE`            |
| `GET`   | `/usuarios/:id` | Detalha                                                    |
| `POST`  | `/usuarios`     | Cria (ver exemplo abaixo)                                  |
| `PATCH` | `/usuarios/:id` | Altera `nome`, `email`, `senha`, `perfil`, `ativo`         |

```json
{
  "nome": "Maria Souza",
  "email": "maria@restaurante.local",
  "senha": "senha123",
  "perfil": "GARCOM"
}
```

A senha nunca é retornada pela API.

### Comandas

| Método | Rota                                | Descrição                                                   |
| ------ | ----------------------------------- | ----------------------------------------------------------- |
| `GET`  | `/comandas`                         | Lista. Query: `status=ABERTA\|FECHAMENTO_SOLICITADO\|FECHADA`, `mesaId=3` |
| `GET`  | `/comandas/:id`                     | Detalha com mesa, garçom, pedidos, itens e total            |
| `POST` | `/comandas`                         | Abre comanda em mesa `LIVRE` — a mesa fica `OCUPADA`        |
| `POST` | `/comandas/:id/solicitar-fechamento`| `ABERTA` → `FECHAMENTO_SOLICITADO`                          |
| `POST` | `/comandas/:id/fechar`              | `FECHAMENTO_SOLICITADO` → `FECHADA`; grava o total e libera a mesa |

### Pedidos

| Método  | Rota                  | Descrição                                                         |
| ------- | --------------------- | ----------------------------------------------------------------- |
| `GET`   | `/pedidos`            | Lista. Query: `status=PRONTO` (ex.: prontos para o garçom), `comandaId=1` |
| `GET`   | `/pedidos/cozinha`    | Fila de preparo: `PENDENTE` e `EM_PREPARO`, do mais antigo ao mais novo |
| `GET`   | `/pedidos/:id`        | Detalha                                                           |
| `POST`  | `/pedidos`            | Lança pedido com itens em uma comanda `ABERTA`                    |
| `PATCH` | `/pedidos/:id/status` | Altera o status — `{ "status": "EM_PREPARO" }`                    |

Transições aceitas: `PENDENTE → EM_PREPARO → PRONTO → ENTREGUE` e
`PENDENTE → CANCELADO`. Detalhes em [modelo-de-dados.md](./modelo-de-dados.md).

---

## Roteiro do fluxo principal

Pré-condição: banco recém-criado com `npm run prisma:deploy` e `npm run db:seed`.
Os IDs abaixo correspondem ao seed (mesa id 3 = mesa nº 3; produto 3 = Filé à
parmegiana; produto 6 = Refrigerante lata; usuário 2 = garçom).

### 1. Listar mesas

`GET /mesas`

```json
[
  {
    "id": 1,
    "numero": 1,
    "capacidade": 4,
    "status": "LIVRE",
    "createdAt": "2026-10-01T23:02:01.030Z",
    "updatedAt": "2026-10-01T23:02:01.030Z",
    "comandaAtiva": null
  }
]
```

### 2. Abrir uma comanda

`POST /comandas`

```json
{ "mesaId": 3, "usuarioId": 2, "nomeCliente": "Ana" }
```

`usuarioId` e `nomeCliente` são opcionais. Resposta `201`:

```json
{
  "id": 1,
  "mesaId": 3,
  "usuarioId": 2,
  "nomeCliente": "Ana",
  "status": "ABERTA",
  "total": "0.00",
  "abertaEm": "2026-10-01T23:02:01.231Z",
  "fechamentoSolicitadoEm": null,
  "fechadaEm": null,
  "updatedAt": "2026-10-01T23:02:01.231Z",
  "mesa": { "id": 3, "numero": 3, "status": "OCUPADA" },
  "usuario": { "id": 2, "nome": "Garçom Exemplo", "perfil": "GARCOM" },
  "pedidos": []
}
```

Repetir a requisição retorna `409` — *"Mesa 3 não está livre (status atual: OCUPADA)"*.

### 3. Consultar a comanda

`GET /comandas/1` — mesmo formato da resposta anterior, incluindo os pedidos.

### 4. Listar produtos

`GET /produtos?disponivel=true`

```json
[
  {
    "id": 3,
    "nome": "Filé à parmegiana",
    "descricao": "Acompanha arroz e fritas",
    "preco": "64.90",
    "disponivel": true,
    "categoriaId": 2,
    "createdAt": "2026-10-01T23:02:01.090Z",
    "updatedAt": "2026-10-01T23:02:01.090Z",
    "categoria": { "id": 2, "nome": "Pratos principais" }
  }
]
```

### 5. Criar um pedido com itens

`POST /pedidos`

```json
{
  "comandaId": 1,
  "observacao": "Mesa com criança",
  "itens": [
    { "produtoId": 3, "quantidade": 2, "observacao": "Um sem queijo" },
    { "produtoId": 6, "quantidade": 2 }
  ]
}
```

Resposta `201`:

```json
{
  "id": 1,
  "comandaId": 1,
  "status": "PENDENTE",
  "observacao": "Mesa com criança",
  "createdAt": "2026-10-01T23:02:01.278Z",
  "updatedAt": "2026-10-01T23:02:01.278Z",
  "itens": [
    {
      "id": 1,
      "pedidoId": 1,
      "produtoId": 3,
      "quantidade": 2,
      "precoUnitario": "64.90",
      "observacao": "Um sem queijo",
      "produto": { "id": 3, "nome": "Filé à parmegiana" },
      "subtotal": "129.80"
    },
    {
      "id": 2,
      "pedidoId": 1,
      "produtoId": 6,
      "quantidade": 2,
      "precoUnitario": "7.00",
      "observacao": null,
      "produto": { "id": 6, "nome": "Refrigerante lata" },
      "subtotal": "14.00"
    }
  ],
  "comanda": { "id": 1, "status": "ABERTA", "mesa": { "id": 3, "numero": 3 } },
  "total": "143.80"
}
```

### 6. Consultar pedidos da cozinha

`GET /pedidos/cozinha` — lista de pedidos no mesmo formato acima, apenas
`PENDENTE` e `EM_PREPARO`.

### 7. PENDENTE → EM_PREPARO

`PATCH /pedidos/1/status`

```json
{ "status": "EM_PREPARO" }
```

### 8. EM_PREPARO → PRONTO

`PATCH /pedidos/1/status`

```json
{ "status": "PRONTO" }
```

O garçom pode consultar os pedidos prontos com `GET /pedidos?status=PRONTO`.

### 9. PRONTO → ENTREGUE

`PATCH /pedidos/1/status`

```json
{ "status": "ENTREGUE" }
```

Cada passo retorna `200` com o pedido atualizado. Uma transição fora da ordem
retorna `409`, por exemplo:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Transição inválida: PENDENTE → PRONTO. Permitido(s) a partir de PENDENTE: EM_PREPARO, CANCELADO"
}
```

### 10. Solicitar fechamento da comanda

`POST /comandas/1/solicitar-fechamento` (sem corpo) — resposta `200`:

```json
{
  "id": 1,
  "status": "FECHAMENTO_SOLICITADO",
  "total": "143.80",
  "fechamentoSolicitadoEm": "2026-10-01T23:02:01.458Z",
  "fechadaEm": null,
  "...": "demais campos da comanda"
}
```

Se houver pedido `PENDENTE`, `EM_PREPARO` ou `PRONTO`, retorna `409`
(*"A comanda possui pedidos não entregues: #2 (PENDENTE). Entregue ou cancele-os antes."*).
A partir daqui, novos pedidos na comanda são recusados com `409`.

### 11. Fechar a comanda

`POST /comandas/1/fechar` (sem corpo) — resposta `200`:

```json
{
  "id": 1,
  "status": "FECHADA",
  "total": "143.80",
  "fechamentoSolicitadoEm": "2026-10-01T23:02:01.458Z",
  "fechadaEm": "2026-10-01T23:02:01.496Z",
  "mesa": { "id": 3, "numero": 3, "status": "LIVRE" },
  "...": "demais campos da comanda"
}
```

### 12. Verificar que a mesa voltou para LIVRE

`GET /mesas/3`

```json
{
  "id": 3,
  "numero": 3,
  "capacidade": 4,
  "status": "LIVRE",
  "createdAt": "2026-10-01T23:02:01.044Z",
  "updatedAt": "2026-10-01T23:02:01.498Z",
  "comandaAtiva": null
}
```

## Teste automatizado do fluxo

O mesmo roteiro é executado por `npm run test:e2e`
([`backend/test/fluxo-mvp.e2e-spec.ts`](../backend/test/fluxo-mvp.e2e-spec.ts)),
que cria seus próprios dados e não depende do seed.
