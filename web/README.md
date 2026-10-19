# Web — Cozinha e Gerência

Cliente web em **Next.js 15 (App Router) + React 19 + TypeScript** que consome a API NestJS.
Não acessa o banco: toda leitura e alteração passa pela API, que concentra as regras de negócio
e as permissões (contrato: [`docs/contrato-api.md`](../docs/contrato-api.md)).

## Telas

| Tela | Perfis | O que faz |
|---|---|---|
| `/login` | todos | E-mail e senha; JWT guardado em cookie `httpOnly` |
| `/cozinha` | Cozinha, Gerente, Admin | Quadro com Pendente, Em preparo e Pronto; iniciar preparo e marcar pronto; atualiza sozinho a cada 10 s |
| `/salao` e `/salao/[id]` | Gerente, Admin | Mesas livres, ocupadas e aguardando fechamento; detalhe da mesa com a comanda |
| `/comandas` e `/comandas/[id]` | Gerente, Admin | Filtro por situação, itens, total calculado pela API e fechamento quando a API autoriza |
| `/cardapio`, `/cardapio/novo`, `/cardapio/[id]/editar` | Gerente, Admin | Produtos por categoria, cadastro, edição e nova categoria |

O perfil Garçom usa o aplicativo mobile; no web ele vê apenas um aviso.

## Como executar

Pré-requisito: a API rodando (veja [`backend/README.md`](../backend/README.md)).

```bash
cd web
npm install
cp ..env ..env     # Windows (PowerShell): Copy-Item ..env ..env
npm run dev                    # http://localhost:3001
```

Versão de produção local: `npm run build` e depois `npm start` (também na porta 3001).

Usuários de desenvolvimento (criados pelo seed do backend, senha `senha123`):
`cozinha@restaurante.local` (cozinha) e `gerente@restaurante.local` (gerência).

## Verificações

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint (next/core-web-vitals + next/typescript)
npm run build       # build de produção
```

## Estrutura

```
web/src/
├── middleware.ts           # sem cookie de sessão → /login
├── lib/
│   ├── api.ts              # ÚNICO ponto de acesso HTTP à API (fetch + token + erros)
│   ├── sessao.ts           # usuário atual (/auth/me), exigência de perfil, tratamento de 401
│   ├── permissoes.ts       # menu e telas por perfil (espelho do contrato, só para a interface)
│   ├── formato.ts          # moeda, datas e rótulos de status
│   └── tipos.ts            # tipos das respostas da API
├── components/             # Selo, Estados (vazio/erro/carregando), Cabecalho, BotaoEnviar, ComandaDetalhe…
└── app/
    ├── login/  sair/  acoes-sessao.ts
    └── (painel)/           # layout autenticado + cozinha, salao, comandas, cardapio
```

## Segurança

- O JWT fica em cookie `httpOnly` + `SameSite=Lax` (+ `Secure` em produção): o JavaScript do
  navegador não lê o token. As chamadas à API são feitas pelo servidor do Next (Server Components
  e Server Actions); `API_URL` não é exposta ao navegador.
- Token recusado pela API (expirado, usuário desativado) → `/sair` remove o cookie e volta ao login.
- Esconder botões por perfil é só conveniência: a API decide (`401`/`403`/`409`).
- Cabeçalhos: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy`; `X-Powered-By` desativado.
