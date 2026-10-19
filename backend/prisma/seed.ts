/**
 * Dados iniciais para DESENVOLVIMENTO e testes manuais.
 * Idempotente: pode ser executado várias vezes (upsert por chave única).
 *
 *   npx prisma db seed
 *
 * As senhas abaixo são fictícias, apenas para ambiente local.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PerfilUsuario,
  Prisma,
  PrismaClient,
} from '../src/generated/prisma/client.js';
import { gerarHashSenha } from '../src/common/utils/password.util.js';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL não definida. Copie ..env para .env.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const SENHA_DEV = 'senha123';

const usuarios: { nome: string; email: string; perfil: PerfilUsuario }[] = [
  { nome: 'Administrador', email: 'admin@restaurante.local', perfil: 'ADMIN' },
  { nome: 'Gerente', email: 'gerente@restaurante.local', perfil: 'GERENTE' },
  { nome: 'Garçom João', email: 'joao@restaurante.local', perfil: 'GARCOM' },
  { nome: 'Garçom Maria', email: 'maria@restaurante.local', perfil: 'GARCOM' },
  { nome: 'Cozinha', email: 'cozinha@restaurante.local', perfil: 'COZINHA' },
];

const cardapio: Record<
  string,
  { ordem: number; produtos: [string, string, number][] }
> = {
  Entradas: {
    ordem: 1,
    produtos: [
      ['Batata frita', 'Porção de batata frita crocante', 29.9],
      ['Pastel de carne (6 un.)', 'Pastéis pequenos de carne moída', 32.0],
      ['Bruschetta', 'Pão italiano com tomate, manjericão e azeite', 27.5],
    ],
  },
  'Pratos principais': {
    ordem: 2,
    produtos: [
      ['Filé à parmegiana', 'Acompanha arroz e fritas', 64.9],
      ['Risoto de cogumelos', 'Arroz arbóreo com mix de cogumelos', 58.0],
      ['Frango grelhado', 'Acompanha legumes salteados', 45.9],
    ],
  },
  Bebidas: {
    ordem: 3,
    produtos: [
      ['Refrigerante lata', '350 ml', 7.0],
      ['Suco natural', 'Laranja, limão ou abacaxi — 500 ml', 12.0],
      ['Água mineral', '500 ml, com ou sem gás', 5.0],
    ],
  },
  Sobremesas: {
    ordem: 4,
    produtos: [
      ['Pudim de leite', 'Fatia', 14.0],
      ['Petit gâteau', 'Com sorvete de creme', 26.9],
    ],
  },
};

async function main() {
  const senhaHash = await gerarHashSenha(SENHA_DEV);
  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nome: u.nome, perfil: u.perfil },
      create: { ...u, senhaHash },
    });
  }

  for (let numero = 1; numero <= 10; numero++) {
    await prisma.mesa.upsert({
      where: { numero },
      update: {},
      create: { numero, capacidade: numero <= 6 ? 4 : 6 },
    });
  }

  for (const [nome, { ordem, produtos }] of Object.entries(cardapio)) {
    const categoria = await prisma.categoria.upsert({
      where: { nome },
      update: { ordem },
      create: { nome, ordem },
    });
    for (const [nomeProduto, descricao, preco] of produtos) {
      await prisma.produto.upsert({
        where: {
          categoriaId_nome: { categoriaId: categoria.id, nome: nomeProduto },
        },
        update: { descricao, preco: new Prisma.Decimal(preco) },
        create: {
          nome: nomeProduto,
          descricao,
          preco: new Prisma.Decimal(preco),
          categoriaId: categoria.id,
        },
      });
    }
  }

  const [nUsuarios, nMesas, nProdutos] = await Promise.all([
    prisma.usuario.count(),
    prisma.mesa.count(),
    prisma.produto.count(),
  ]);
  console.log(
    `Seed concluído: ${nUsuarios} usuários, ${nMesas} mesas, ${nProdutos} produtos. ` +
      `Senha dos usuários de desenvolvimento: ${SENHA_DEV}`,
  );
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
