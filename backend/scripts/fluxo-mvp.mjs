/**
 * Executa o fluxo principal do MVP contra a API em execução, só via HTTP,
 * autenticando cada etapa com o perfil responsável (contrato v2), e verifica
 * que regras de negócio e permissões recusam operações inválidas.
 *
 *   npm run fluxo:mvp
 *   API_URL=http://localhost:3000/api SENHA=senha123 npm run fluxo:mvp
 *
 * Requer: API no ar + migrations aplicadas + seed executado.
 */
const API = process.env.API_URL ?? 'http://localhost:3000/api';
const SENHA = process.env.SENHA ?? 'senha123';
let passo = 0;

async function chamar(metodo, caminho, corpo, token) {
  const headers = {};
  if (corpo) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resposta = await fetch(`${API}${caminho}`, {
    method: metodo,
    headers,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resposta.text();
  return { status: resposta.status, corpo: texto ? JSON.parse(texto) : null };
}

async function etapa(descricao, metodo, caminho, { corpo, token, esperado = [200, 201] } = {}) {
  passo += 1;
  const r = await chamar(metodo, caminho, corpo, token);
  const lista = [esperado].flat();
  if (!lista.includes(r.status)) {
    console.error(`\n✗ ${passo}. ${descricao}\n  ${metodo} ${caminho} → ${r.status} (esperado ${lista.join('/')})`);
    console.error(JSON.stringify(r.corpo, null, 2));
    process.exit(1);
  }
  console.log(`✓ ${String(passo).padStart(2)}. ${descricao}  [${metodo} ${caminho} → ${r.status}]`);
  return r.corpo;
}

function confirmar(condicao, mensagem) {
  if (!condicao) {
    console.error(`✗ Verificação falhou: ${mensagem}`);
    process.exit(1);
  }
}

async function login(email) {
  const r = await etapa(`Login ${email}`, 'POST', '/auth/login', { corpo: { email, senha: SENHA }, esperado: 200 });
  return r.accessToken;
}

console.log(`Fluxo MVP contra ${API}\n`);

const garcom = await login('joao@restaurante.local');
const cozinha = await login('cozinha@restaurante.local');
const gerente = await login('gerente@restaurante.local');

// 1. Listar mesas
const mesas = await etapa('Listar mesas (garçom)', 'GET', '/mesas', { token: garcom });
const mesa = mesas.find((m) => m.status === 'LIVRE');
confirmar(mesa, 'nenhuma mesa LIVRE (rode o seed)');

// 2. Abrir comanda — o garçom é o usuário do token
const comanda = await etapa('Abrir comanda (garçom)', 'POST', '/comandas', {
  token: garcom,
  corpo: { mesaId: mesa.id, nomeCliente: 'Cliente de teste' },
});
confirmar(comanda.garcom?.perfil === 'GARCOM', 'comanda deveria registrar o garçom do token');

// 3. Consultar comanda
const consultada = await etapa('Consultar comanda', 'GET', `/comandas/${comanda.id}`, { token: garcom });
confirmar(consultada.mesa.status === 'OCUPADA', 'mesa deveria estar OCUPADA');

// 4. Listar produtos
const produtos = await etapa('Listar produtos', 'GET', '/produtos?disponivel=true', { token: garcom });
confirmar(produtos.length >= 2, 'são necessários ao menos 2 produtos');

// 5. Criar pedido com itens
const pedido = await etapa('Criar pedido com itens (garçom)', 'POST', '/pedidos', {
  token: garcom,
  corpo: {
    comandaId: comanda.id,
    observacao: 'Mesa com criança',
    itens: [
      { produtoId: produtos[0].id, quantidade: 2, observacao: 'sem sal' },
      { produtoId: produtos[1].id, quantidade: 1 },
    ],
  },
});
confirmar(pedido.status === 'PENDENTE', 'pedido deveria nascer PENDENTE');

// 6. Fila da cozinha
const fila = await etapa('Consultar fila da cozinha (cozinha)', 'GET', '/pedidos/cozinha', { token: cozinha });
confirmar(fila.some((p) => p.id === pedido.id), 'pedido deveria estar na fila da cozinha');

// 7–9. Ciclo de vida do pedido
await etapa('PENDENTE → EM_PREPARO (cozinha)', 'PATCH', `/pedidos/${pedido.id}/status`, { token: cozinha, corpo: { status: 'EM_PREPARO' } });
await etapa('EM_PREPARO → PRONTO (cozinha)', 'PATCH', `/pedidos/${pedido.id}/status`, { token: cozinha, corpo: { status: 'PRONTO' } });
await etapa('PRONTO → ENTREGUE (garçom)', 'PATCH', `/pedidos/${pedido.id}/status`, { token: garcom, corpo: { status: 'ENTREGUE' } });

// 10. Solicitar fechamento
const solicitada = await etapa('Solicitar fechamento (garçom)', 'POST', `/comandas/${comanda.id}/solicitar-fechamento`, { token: garcom });
confirmar(solicitada.status === 'FECHAMENTO_SOLICITADO', 'status deveria ser FECHAMENTO_SOLICITADO');

// 11. Fechar comanda (gerência)
const fechada = await etapa('Fechar comanda (gerente)', 'POST', `/comandas/${comanda.id}/fechar`, { token: gerente });
confirmar(fechada.status === 'FECHADA', 'comanda deveria estar FECHADA');
const esperado = (Number(produtos[0].preco) * 2 + Number(produtos[1].preco)).toFixed(2);
confirmar(fechada.total === esperado, `total deveria ser ${esperado}, veio ${fechada.total}`);

// 12. Mesa voltou para LIVRE
const mesaFinal = await etapa('Verificar mesa LIVRE', 'GET', `/mesas/${mesa.id}`, { token: gerente });
confirmar(mesaFinal.status === 'LIVRE', 'mesa deveria ter voltado para LIVRE');

console.log(`\nFluxo principal OK — comanda ${comanda.id}, total R$ ${fechada.total}.`);
console.log('\nAutenticação e permissões (devem ser recusadas):\n');

await etapa('Recusa rota sem token', 'GET', '/mesas', { esperado: 401 });
await etapa('Recusa token adulterado', 'GET', '/mesas', { token: `${garcom}x`, esperado: 401 });
await etapa('Recusa senha errada', 'POST', '/auth/login', { corpo: { email: 'gerente@restaurante.local', senha: 'errada' }, esperado: 401 });
await etapa('GET /auth/me devolve o perfil', 'GET', '/auth/me', { token: cozinha });
await etapa('Cozinha não fecha comanda', 'POST', `/comandas/${comanda.id}/fechar`, { token: cozinha, esperado: 403 });
await etapa('Garçom não cadastra produto', 'POST', '/produtos', { token: garcom, corpo: { nome: 'X', preco: 1, categoriaId: 1 }, esperado: 403 });
await etapa('Garçom não vê fila da cozinha', 'GET', '/pedidos/cozinha', { token: garcom, esperado: 403 });

console.log('\nRegras de negócio (devem ser recusadas):\n');

const outra = mesas.find((m) => m.status === 'LIVRE' && m.id !== mesa.id) ?? mesa;
const c2 = await etapa('Abrir comanda para os testes de regra', 'POST', '/comandas', { token: garcom, corpo: { mesaId: outra.id } });
await etapa('Recusa 2ª comanda na mesma mesa', 'POST', '/comandas', { token: garcom, corpo: { mesaId: outra.id }, esperado: 409 });
await etapa('Recusa garcomId no corpo (vem do token)', 'POST', '/comandas', { token: garcom, corpo: { mesaId: outra.id, garcomId: 1 }, esperado: 400 });
await etapa('Recusa pedido sem itens', 'POST', '/pedidos', { token: garcom, corpo: { comandaId: c2.id, itens: [] }, esperado: 400 });
await etapa('Recusa produto inexistente', 'POST', '/pedidos', { token: garcom, corpo: { comandaId: c2.id, itens: [{ produtoId: 999999, quantidade: 1 }] }, esperado: 404 });
const p2 = await etapa('Criar pedido para os testes de regra', 'POST', '/pedidos', { token: garcom, corpo: { comandaId: c2.id, itens: [{ produtoId: produtos[0].id, quantidade: 1 }] } });
await etapa('Garçom não move pedido para EM_PREPARO', 'PATCH', `/pedidos/${p2.id}/status`, { token: garcom, corpo: { status: 'EM_PREPARO' }, esperado: 403 });
await etapa('Recusa pular de PENDENTE para PRONTO', 'PATCH', `/pedidos/${p2.id}/status`, { token: cozinha, corpo: { status: 'PRONTO' }, esperado: 409 });
await etapa('Recusa fechar com pedido pendente', 'POST', `/comandas/${c2.id}/fechar`, { token: gerente, esperado: 409 });
await etapa('Cancelar pedido PENDENTE (garçom)', 'PATCH', `/pedidos/${p2.id}/status`, { token: garcom, corpo: { status: 'CANCELADO' } });
await etapa('Solicitar fechamento (regra)', 'POST', `/comandas/${c2.id}/solicitar-fechamento`, { token: garcom });
await etapa('Recusa pedido após solicitar fechamento', 'POST', '/pedidos', { token: garcom, corpo: { comandaId: c2.id, itens: [{ produtoId: produtos[0].id, quantidade: 1 }] }, esperado: 409 });
const c2Cancelada = await etapa('Cancelar comanda sem pedidos ativos (gerente)', 'POST', `/comandas/${c2.id}/cancelar`, { token: gerente });
confirmar(c2Cancelada.mesa.status === 'LIVRE', 'mesa da comanda cancelada deveria estar LIVRE');
await etapa('Comanda inexistente → 404', 'GET', '/comandas/999999', { token: gerente, esperado: 404 });

console.log('\nTodas as verificações passaram.');
