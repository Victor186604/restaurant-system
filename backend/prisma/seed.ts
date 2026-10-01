// Dados iniciais para desenvolvimento e testes manuais da API.
// Execução: npm run db:seed (idempotente — pode ser executado mais de uma vez).
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { Perfil } from '../src/generated/prisma/enums.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

// Senha de desenvolvimento para todos os usuários de exemplo.
const SENHA_PADRAO = 'senha123';

const usuarios = [
  {
    nome: 'Gerente Exemplo',
    email: 'gerente@restaurante.local',
    perfil: Perfil.GERENTE,
  },
  {
    nome: 'Garçom Exemplo',
    email: 'garcom@restaurante.local',
    perfil: Perfil.GARCOM,
  },
  {
    nome: 'Cozinha Exemplo',
    email: 'cozinha@restaurante.local',
    perfil: Perfil.COZINHA,
  },
];

const cardapio: Record<
  string,
  { nome: string; descricao: string; preco: string }[]
> = {
  Entradas: [
    { nome: 'Pão de alho', descricao: 'Porção com 6 unidades', preco: '18.90' },
    {
      nome: 'Bolinho de bacalhau',
      descricao: 'Porção com 8 unidades',
      preco: '39.90',
    },
  ],
  'Pratos principais': [
    {
      nome: 'Filé à parmegiana',
      descricao: 'Acompanha arroz e fritas',
      preco: '64.90',
    },
    {
      nome: 'Risoto de cogumelos',
      descricao: 'Arroz arbóreo, shiitake e parmesão',
      preco: '58.00',
    },
    {
      nome: 'Feijoada individual',
      descricao: 'Acompanha arroz, couve e farofa',
      preco: '49.90',
    },
  ],
  Bebidas: [
    { nome: 'Refrigerante lata', descricao: '350 ml', preco: '7.00' },
    {
      nome: 'Suco natural',
      descricao: '500 ml — laranja, limão ou abacaxi',
      preco: '12.00',
    },
    { nome: 'Água mineral', descricao: '500 ml', preco: '5.00' },
  ],
  Sobremesas: [
    { nome: 'Pudim', descricao: 'Fatia', preco: '14.50' },
    { nome: 'Petit gâteau', descricao: 'Com sorvete de creme', preco: '24.90' },
  ],
};

async function main() {
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);
  for (const usuario of usuarios) {
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: {},
      create: { ...usuario, senhaHash },
    });
  }

  for (let numero = 1; numero <= 10; numero++) {
    await prisma.mesa.upsert({
      where: { numero },
      update: {},
      create: { numero, capacidade: numero <= 6 ? 4 : 6 },
    });
  }

  for (const [nomeCategoria, produtos] of Object.entries(cardapio)) {
    const categoria = await prisma.categoria.upsert({
      where: { nome: nomeCategoria },
      update: {},
      create: { nome: nomeCategoria },
    });
    for (const produto of produtos) {
      const existente = await prisma.produto.findFirst({
        where: { nome: produto.nome, categoriaId: categoria.id },
      });
      if (!existente) {
        await prisma.produto.create({
          data: { ...produto, categoriaId: categoria.id },
        });
      }
    }
  }

  console.log(
    'Seed concluído: 3 usuários, 10 mesas, 4 categorias, 10 produtos.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
