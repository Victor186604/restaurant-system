// Configuração da CLI do Prisma 7.
// O Prisma 7 não carrega o .env sozinho, por isso o import de dotenv/config.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // process.env (e não env()) para que `prisma generate` funcione mesmo
    // sem DATABASE_URL definida, por exemplo durante o `npm install`.
    url: process.env['DATABASE_URL'],
  },
});
