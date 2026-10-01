# Backend — API de Comandas e Pedidos

API REST em NestJS para o sistema de comandas e pedidos do restaurante
(Checkpoint 1 — Backend). Todo o fluxo do MVP pode ser testado por um cliente
HTTP (Postman, Insomnia, Bruno, curl).

## Stack

| Tecnologia          | Versão |
| ------------------- | ------ |
| Node.js             | 22 LTS |
| NestJS              | 12     |
| Prisma ORM          | 7      |
| @prisma/adapter-pg  | 7      |
| PostgreSQL          | 18     |
| class-validator     | 0.15   |

## Como executar

Pré-requisitos: Node.js 22 e Docker (ou um PostgreSQL 18 já instalado).

```bash
cd backend

# 1. Variáveis de ambiente (ajuste a senha)
cp .env.example .env

# 2. Banco PostgreSQL 18
docker compose up -d

# 3. Dependências (também gera o Prisma Client)
npm install

# 4. Migrations e dados iniciais
npm run prisma:deploy     # aplica as migrations existentes
npm run db:seed           # 3 usuários, 10 mesas, 4 categorias, 10 produtos

# 5. API em http://localhost:3000
npm run start:dev
```

Para um banco já existente sem Docker, basta apontar `DATABASE_URL` no `.env`.

## Scripts

| Script                    | Descrição                                            |
| ------------------------- | ---------------------------------------------------- |
| `npm run start:dev`       | API em modo watch                                    |
| `npm run build`           | Gera o Prisma Client e compila para `dist/`          |
| `npm run start:prod`      | Executa a versão compilada                           |
| `npm run prisma:generate` | Gera o Prisma Client em `src/generated/prisma`       |
| `npm run prisma:migrate`  | Cria/aplica migrations em desenvolvimento            |
| `npm run prisma:deploy`   | Aplica as migrations existentes                      |
| `npm run prisma:studio`   | Abre o Prisma Studio                                 |
| `npm run db:seed`         | Popula o banco com dados de exemplo (idempotente)    |
| `npm run db:reset`        | Recria o banco do zero (apaga todos os dados)        |
| `npm run lint`            | Lint com oxlint                                      |
| `npm test`                | Testes unitários                                     |
| `npm run test:e2e`        | Testes e2e do fluxo completo (requer banco)          |

## Estrutura

```
src/
├── main.ts                     # bootstrap
├── app.module.ts               # ValidationPipe, filtro de erros e interceptor globais
├── prisma/                     # PrismaService (PrismaClient + @prisma/adapter-pg)
├── common/
│   ├── filters/                # erros do Prisma → HTTP (409, 404)
│   └── interceptors/           # Decimal → "0.00"
├── usuarios/                   # usuários e perfis (GARCOM, COZINHA, GERENTE)
├── mesas/
├── categorias/
├── produtos/
├── comandas/                   # abrir, solicitar fechamento, fechar
├── pedidos/                    # lançar pedido, fila da cozinha, status
└── generated/prisma/           # Prisma Client gerado (não versionado)
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

## Documentação

- [Referência da API e roteiro de testes](../docs/api.md)
- [Modelo de dados e regras de negócio](../docs/modelo-de-dados.md)

## Autenticação

Autenticação JWT não faz parte deste checkpoint. O modelo `Usuario` já possui
`perfil` e `senhaHash` (bcrypt), permitindo adicionar login e guards por perfil
na próxima etapa sem alterar o esquema. Enquanto isso, a comanda aceita um
`usuarioId` opcional para identificar o garçom responsável.
