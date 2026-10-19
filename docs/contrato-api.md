# Contrato da API — v2 (Checkpoint 2)

Este documento é o **contrato** entre o backend NestJS e os clientes (web e mobile).
Detalhes de formato de cada recurso, regras de negócio e exemplos completos de JSON:
[`backend-api.md`](./backend-api.md).

## O que mudou em relação ao Checkpoint 1

A menor alteração possível para o cliente web: **autenticação JWT e controle de acesso por perfil**.
Nenhuma tabela, coluna ou migration nova — o modelo `Usuario` (com `perfil` e `senhaHash`) já existia.

| Mudança | Detalhe |
|---|---|
| Novo | `POST /api/auth/login` e `GET /api/auth/me` |
| Novo | Todas as rotas exigem `Authorization: Bearer <token>`, exceto `GET /api` e `POST /api/auth/login` |
| Novo | Cada rota aceita somente os perfis da tabela "Permissões" (senão `403`) |
| Alterado | `POST /api/comandas` não aceita mais `garcomId`: o garçom é o usuário do token |
| Alterado | `POST /api/pedidos` não aceita mais `criadoPorId`: o autor é o usuário do token |
| Alterado | `PATCH /api/pedidos/:id/status` passa a checar o perfil conforme o status de destino |

## Autenticação

### `POST /api/auth/login` (público)

```json
{ "email": "cozinha@restaurante.local", "senha": "senha123" }
```

`200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "usuario": { "id": 5, "nome": "Cozinha", "email": "cozinha@restaurante.local", "perfil": "COZINHA" }
}
```

| Situação | Resposta |
|---|---|
| E-mail ou senha incorretos, ou usuário inativo | `401` `"E-mail ou senha inválidos."` (mesma mensagem nos três casos) |
| Corpo inválido | `400` |
| 5 tentativas erradas para o mesmo e-mail + IP em 15 min | `429` até o fim da janela |

`expiresIn` está em segundos (padrão 8 h, um turno; configurável por `JWT_EXPIRES_IN`).

### `GET /api/auth/me` (qualquer perfil)

`200 OK` → `{ "id": 5, "nome": "Cozinha", "email": "cozinha@restaurante.local", "perfil": "COZINHA" }`

### Erros de autenticação e autorização

| Status | Quando |
|---|---|
| `401 Unauthorized` | Token ausente, inválido, expirado, ou usuário desativado depois do login |
| `403 Forbidden` | Token válido, mas o perfil não tem permissão para a rota/ação |

O usuário é recarregado do banco a cada requisição: desativar um usuário ou trocar seu perfil
vale imediatamente, sem esperar o token expirar.

## Permissões

Perfis: `ADMIN`, `GERENTE`, `GARCOM`, `COZINHA`. ✅ = permitido.

| Rota | ADMIN | GERENTE | GARCOM | COZINHA |
|---|:-:|:-:|:-:|:-:|
| `GET /api`, `POST /api/auth/login` | público | público | público | público |
| `GET /api/auth/me` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/mesas`, `GET /api/mesas/:id` | ✅ | ✅ | ✅ | |
| `POST /api/mesas`, `PATCH /api/mesas/:id` | ✅ | ✅ | | |
| `GET /api/categorias[/:id]`, `GET /api/produtos[/:id]` | ✅ | ✅ | ✅ | ✅ |
| `POST`/`PATCH` categorias e produtos | ✅ | ✅ | | |
| `POST /api/comandas` (abrir) | ✅ | ✅ | ✅ | |
| `GET /api/comandas`, `GET /api/comandas/:id` | ✅ | ✅ | ✅ | |
| `POST /api/comandas/:id/solicitar-fechamento` | ✅ | ✅ | ✅ | |
| `POST /api/comandas/:id/fechar`, `.../cancelar` | ✅ | ✅ | | |
| `POST /api/pedidos` | ✅ | ✅ | ✅ | |
| `GET /api/pedidos`, `GET /api/pedidos/:id` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/pedidos/cozinha` | ✅ | ✅ | | ✅ |
| `PATCH /api/pedidos/:id/status` → `EM_PREPARO`, `PRONTO` | ✅ | ✅ | | ✅ |
| `PATCH /api/pedidos/:id/status` → `ENTREGUE`, `CANCELADO` | ✅ | ✅ | ✅ | |
| `GET /api/usuarios[/:id]` | ✅ | ✅ | | |
| `POST /api/usuarios`, `PATCH /api/usuarios/:id` | ✅ | | | |

As regras de negócio (máquina de estados do pedido, fechamento só sem pedidos pendentes etc.)
continuam valendo **além** das permissões: um `GERENTE` também recebe `409` se tentar fechar
uma comanda com pedido em preparo.

## Endpoints usados pelo cliente web (Checkpoint 2)

| Tela | Endpoints |
|---|---|
| Login / sessão | `POST /auth/login`, `GET /auth/me` |
| Cozinha (Kanban) | `GET /pedidos/cozinha`, `GET /pedidos?status=PRONTO`, `PATCH /pedidos/:id/status` |
| Salão | `GET /mesas`, `GET /mesas/:id`, `GET /comandas/:id` |
| Comandas | `GET /comandas?status=...`, `GET /comandas/:id`, `POST /comandas/:id/fechar` |
| Cardápio | `GET /categorias?incluirInativas=true`, `POST /categorias`, `GET /produtos?incluirInativos=true`, `GET /produtos/:id`, `POST /produtos`, `PATCH /produtos/:id` |

O estado "aguardando fechamento" do salão **não é um status de mesa**: é uma mesa `OCUPADA`
cuja `comandaAtiva.status` é `FECHAMENTO_SOLICITADO` (já retornado por `GET /mesas`).

O botão "Fechar comanda" é exibido quando `resumo.podeFechar === true` (calculado pela API) e o
perfil é `GERENTE` ou `ADMIN`; a decisão final é sempre da API (`403`/`409` se não permitido).
