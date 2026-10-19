# Backend — API de comandas e pedidos

API REST em NestJS para o sistema de comandas e pedidos do restaurante.
Referência completa de endpoints, regras de negócio e exemplos de JSON:
[`docs/backend-api.md`](../docs/backend-api.md).

## Stack

- Node.js 22 LTS
- NestJS 11
- Prisma 7 com `@prisma/adapter-pg` (driver `pg`)
- PostgreSQL 18
- class-validator / class-transformer (validação dos DTOs)
- Vitest (testes)

## Como executar

Pré-requisitos: Node.js 22 e um PostgreSQL 18 (o `docker-compose.yml` sobe um pronto).

```bash
cd backend

# 1. Dependências (o postinstall já executa `prisma generate`)
npm install

# 2. Variáveis de ambiente
cp ..env .env        # Windows (PowerShell): Copy-Item ..env .env
#    Ajuste DATABASE_URL se não for usar o docker-compose e gere o JWT_SECRET:
#    node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
#    (cole o resultado em JWT_SECRET="..." no .env; a API não inicia sem ele)

# 3. Banco de dados
npm run db:up               # sobe o PostgreSQL 18 via Docker (opcional)
npx prisma migrate deploy   # aplica as migrations
npx prisma db seed          # dados de exemplo: 10 mesas, cardápio, usuários

# 4. API
npm run start:dev           # http://localhost:3000/api
```

Para conferir o fluxo completo do MVP (com a API rodando, em outro terminal):

```bash
npm run fluxo:mvp
```

### Usando um PostgreSQL já instalado

Crie o banco e aponte a `DATABASE_URL` para ele, por exemplo:

```
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/restaurante?schema=public"
```

Atenção ao formato: a linha deve ter **uma** atribuição e o valor entre aspas uma única vez.
Se o valor for inválido, a API não sobe e informa o problema.

## Scripts

| Script | O que faz |
|---|---|
| `npm run start:dev` | API em modo watch |
| `npm run build` / `npm run start:prod` | Compila para `dist/` / executa a versão compilada |
| `npm test` | Testes unitários |
| `npm run test:e2e` | Testes e2e (precisam do banco) |
| `npm run lint` / `npm run format` | oxlint / Prettier |
| `npm run prisma:migrate` | `prisma migrate dev` — cria nova migration após alterar o schema |
| `npm run prisma:deploy` | `prisma migrate deploy` — aplica migrations pendentes |
| `npm run prisma:seed` | Popula dados de exemplo (idempotente) |
| `npm run prisma:studio` | Interface visual do banco |
| `npm run db:up` / `npm run db:down` | Sobe/derruba o PostgreSQL do docker-compose |
| `npm run fluxo:mvp` | Executa o fluxo principal + verificações de regras via HTTP |

## Usuários do seed (somente desenvolvimento)

Todos com a senha `senha123`. Entre com `POST /api/auth/login` e envie o token em
`Authorization: Bearer <token>`. O que cada perfil pode fazer: [`docs/contrato-api.md`](../docs/contrato-api.md).

| Perfil | E-mail |
|---|---|
| ADMIN | admin@restaurante.local |
| GERENTE | gerente@restaurante.local |
| GARCOM | joao@restaurante.local, maria@restaurante.local |
| COZINHA | cozinha@restaurante.local |

## Estrutura

```
backend/
├── prisma/
│   ├── schema.prisma         # modelo de dados
│   ├── migrations/           # migrations SQL versionadas
│   └── seed.ts               # dados de exemplo
├── prisma.config.ts          # configuração da CLI do Prisma 7
├── scripts/fluxo-mvp.mjs     # teste do fluxo principal via HTTP
├── src/
│   ├── auth/                 # login JWT, guards globais (token + perfis), @Perfis/@Public
│   ├── main.ts               # bootstrap: prefixo /api, ValidationPipe, filtros, CORS
│   ├── config/               # validação das variáveis de ambiente
│   ├── prisma/               # PrismaService (Prisma Client + adapter-pg)
│   ├── common/               # filtro de erros do Prisma, interceptor de Decimal, utilitários
│   ├── usuarios/  mesas/  categorias/  produtos/
│   ├── comandas/             # abertura, fechamento, cancelamento
│   ├── pedidos/              # lançamento, fila da cozinha, máquina de estados
│   └── generated/prisma/     # Prisma Client gerado (não versionado)
└── test/                     # testes e2e
```

Cada módulo segue o padrão `dto/` + `*.service.ts` (regras de negócio) + `*.controller.ts` (rotas).

## Observações

- O Prisma Client é gerado em `src/generated/prisma` (ignorado pelo Git). Após clonar ou
  alterar o schema, rode `npx prisma generate` (o `npm install` já faz isso).
- O schema usa a preview feature `partialIndexes` para garantir, no banco, uma única comanda
  ativa por mesa.
- Valores monetários são retornados como string com 2 casas (`"64.90"`).

## Autenticação e permissões (Checkpoint 2)

- `POST /api/auth/login` devolve um JWT (HS256, validade `JWT_EXPIRES_IN`, padrão 8 h).
- Dois guards globais: `JwtAuthGuard` (exige token em toda rota, exceto as marcadas com
  `@Public()`) e `PerfisGuard` (aplica `@Perfis(...)`). Não os desative para integrar clientes.
- O usuário é recarregado do banco a cada requisição: desativá-lo encerra o acesso na hora.
- Tentativas de login erradas são limitadas (5 por e-mail + IP a cada 15 min → `429`).
- `garcomId` (comanda) e `criadoPorId` (pedido) vêm do token, não do corpo.
