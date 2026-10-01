import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

// Requer um PostgreSQL acessível via DATABASE_URL com as migrations aplicadas.
// O teste cria a própria mesa, categoria e produtos, sem depender do seed.
describe('Fluxo principal do MVP (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const sufixo = Date.now();
  const numeroMesa = 100_000 + (sufixo % 100_000);

  let mesaId: number;
  let produtoId: number;
  let comandaId: number;
  let pedidoId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    const mesa = await request(app.getHttpServer())
      .post('/mesas')
      .send({ numero: numeroMesa, capacidade: 2 })
      .expect(201);
    mesaId = mesa.body.id;

    const categoria = await request(app.getHttpServer())
      .post('/categorias')
      .send({ nome: `Categoria e2e ${sufixo}` })
      .expect(201);

    const produto = await request(app.getHttpServer())
      .post('/produtos')
      .send({
        nome: 'Produto e2e',
        preco: 12.5,
        categoriaId: categoria.body.id,
      })
      .expect(201);
    produtoId = produto.body.id;
    expect(produto.body.preco).toBe('12.50');
  });

  afterAll(async () => {
    await prisma.comanda.deleteMany({ where: { mesaId } });
    await prisma.mesa.deleteMany({ where: { id: mesaId } });
    await prisma.produto.deleteMany({ where: { id: produtoId } });
    await prisma.categoria.deleteMany({
      where: { nome: `Categoria e2e ${sufixo}` },
    });
    await app.close();
  });

  it('1. lista mesas', async () => {
    const res = await request(app.getHttpServer()).get('/mesas').expect(200);
    const mesa = res.body.find((m: { id: number }) => m.id === mesaId);
    expect(mesa).toMatchObject({ status: 'LIVRE', comandaAtiva: null });
  });

  it('2. abre uma comanda e ocupa a mesa', async () => {
    const res = await request(app.getHttpServer())
      .post('/comandas')
      .send({ mesaId, nomeCliente: 'Cliente e2e' })
      .expect(201);
    comandaId = res.body.id;
    expect(res.body).toMatchObject({
      status: 'ABERTA',
      total: '0.00',
      mesa: { id: mesaId, status: 'OCUPADA' },
    });

    await request(app.getHttpServer())
      .post('/comandas')
      .send({ mesaId })
      .expect(409);
  });

  it('3. consulta a comanda', async () => {
    const res = await request(app.getHttpServer())
      .get(`/comandas/${comandaId}`)
      .expect(200);
    expect(res.body).toMatchObject({ id: comandaId, pedidos: [] });
  });

  it('4. lista produtos', async () => {
    const res = await request(app.getHttpServer())
      .get('/produtos?disponivel=true')
      .expect(200);
    expect(res.body.some((p: { id: number }) => p.id === produtoId)).toBe(true);
  });

  it('5. cria um pedido com itens', async () => {
    const res = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        comandaId,
        itens: [{ produtoId, quantidade: 3, observacao: 'sem cebola' }],
      })
      .expect(201);
    pedidoId = res.body.id;
    expect(res.body).toMatchObject({
      status: 'PENDENTE',
      total: '37.50',
      itens: [{ quantidade: 3, precoUnitario: '12.50', subtotal: '37.50' }],
    });
  });

  it('6. consulta a fila da cozinha', async () => {
    const res = await request(app.getHttpServer())
      .get('/pedidos/cozinha')
      .expect(200);
    expect(res.body.some((p: { id: number }) => p.id === pedidoId)).toBe(true);
  });

  it('7-9. avança o pedido até ENTREGUE respeitando as transições', async () => {
    await request(app.getHttpServer())
      .patch(`/pedidos/${pedidoId}/status`)
      .send({ status: 'PRONTO' })
      .expect(409);

    for (const status of ['EM_PREPARO', 'PRONTO', 'ENTREGUE']) {
      const res = await request(app.getHttpServer())
        .patch(`/pedidos/${pedidoId}/status`)
        .send({ status })
        .expect(200);
      expect(res.body.status).toBe(status);
    }
  });

  it('10. solicita o fechamento da comanda', async () => {
    await request(app.getHttpServer())
      .post(`/comandas/${comandaId}/fechar`)
      .expect(409);

    const res = await request(app.getHttpServer())
      .post(`/comandas/${comandaId}/solicitar-fechamento`)
      .expect(200);
    expect(res.body.status).toBe('FECHAMENTO_SOLICITADO');

    await request(app.getHttpServer())
      .post('/pedidos')
      .send({ comandaId, itens: [{ produtoId, quantidade: 1 }] })
      .expect(409);
  });

  it('11. fecha a comanda com o total', async () => {
    const res = await request(app.getHttpServer())
      .post(`/comandas/${comandaId}/fechar`)
      .expect(200);
    expect(res.body).toMatchObject({ status: 'FECHADA', total: '37.50' });
    expect(res.body.fechadaEm).toBeTruthy();
  });

  it('12. a mesa volta para LIVRE', async () => {
    const res = await request(app.getHttpServer())
      .get(`/mesas/${mesaId}`)
      .expect(200);
    expect(res.body).toMatchObject({ status: 'LIVRE', comandaAtiva: null });
  });
});
