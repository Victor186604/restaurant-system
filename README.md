# Sistema de Comandas e Pedidos para Restaurante

Projeto desenvolvido para a disciplina de Programação Web e Mobile.

## Tema

Tema 9 — Comanda e pedidos em restaurante [Avançado]

## Descrição

O sistema será utilizado para o gerenciamento de comandas e pedidos de um restaurante.

O garçom utilizará uma aplicação mobile para lançar pedidos e acompanhar as comandas.

A cozinha e a gerência utilizarão uma aplicação web.

O sistema deverá permitir que diferentes clientes interajam com os mesmos dados, como o garçom enviando um pedido enquanto a cozinha acompanha e atualiza seu preparo.

## Web — Cozinha e Gerência

- Fila de preparo
- Cardápio e preços
- Painel do salão
- Fechamento
- Relatórios

## Mobile — Garçom

- Abrir comanda
- Lançar itens
- Acompanhar pedidos
- Visualizar pedidos prontos
- Solicitar fechamento

## Tecnologias

- NestJS — Backend
- Next.js — Cliente Web
- Flutter — Aplicativo Mobile

## Integrantes

- Victor Plucinski Pavoni

## Estrutura do Projeto

- `backend/` — Backend NestJS
- `web/` — Cliente Web Next.js
- `mobile/` — Aplicativo Flutter
- `docs/` — Documentação do projeto

## Como executar

1. Backend (API NestJS): veja [`backend/README.md`](backend/README.md).
2. Cliente web (cozinha e gerência): veja [`web/README.md`](web/README.md).

Contrato da API (autenticação, permissões e endpoints): [`docs/contrato-api.md`](docs/contrato-api.md).

## Etapas

- Checkpoint 1 — Backend: API REST, modelo de dados e regras de negócio.
- Checkpoint 2 — Cliente web: autenticação JWT, cozinha, salão, comandas e cardápio.
- Próxima etapa — Aplicativo mobile (Flutter) do garçom.
