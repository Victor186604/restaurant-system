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
cp .env.example .env        # Windows (PowerShell): Copy-Item .env.example .env
#    Ajuste DATABASE_URL se não for usar o docker-compose.

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

Todos com a senha `senha123`. A autenticação JWT ainda não está ativa;
os ids servem para `garcomId` (comanda) e `criadoPorId` (pedido).

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
