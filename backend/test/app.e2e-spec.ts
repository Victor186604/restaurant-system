// Teste e2e: requer o PostgreSQL no ar e o .env configurado
// (npm run db:up && npx prisma migrate deploy && npx prisma db seed)
// e JWT_SECRET definido no .env.
import 'dotenv/config';
import type { Server } from 'node:http';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaExceptionFilter } from './../src/common/filters/prisma-exception.filter.js';
import { DecimalInterceptor } from './../src/common/interceptors/decimal.interceptor.js';

describe('API (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mesma configuração do main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new PrismaExceptionFilter());
    app.useGlobalInterceptors(new DecimalInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api informa que a API está no ar', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect((res) => expect(res.body.status).toBe('ok'));
  });

  it('GET /api/mesas sem token é recusado com 401', () => {
    return request(app.getHttpServer()).get('/api/mesas').expect(401);
  });

  it('login inválido é recusado com 401', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ninguem@restaurante.local', senha: 'errada' })
      .expect(401);
  });

  it('login válido devolve token que acessa /api/mesas', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'gerente@restaurante.local', senha: 'senha123' })
      .expect(200);
    expect(login.body.usuario.perfil).toBe('GERENTE');
    await request(app.getHttpServer())
      .get('/api/mesas')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
  });
});
