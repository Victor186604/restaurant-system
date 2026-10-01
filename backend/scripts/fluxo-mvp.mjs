/**
 * Executa o fluxo principal do MVP contra a API em execução, só via HTTP,
 * e verifica também que as regras de negócio recusam operações inválidas.
 *
 *   npm run fluxo:mvp
 *   API_URL=http://localhost:3000/api npm run fluxo:mvp
 *
 * Requer: API no ar + migrations aplicadas + seed executado.
 * Funciona no Windows, Linux e macOS (Node 22, sem dependências).
 */
const API = process.env.API_URL ?? 'http://localhost:3000/api';
let passo = 0;

async function chamar(metodo, caminho, corpo) {
  const resposta = await fetch(`${API}${caminho}`, {
    method: metodo,
    headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resposta.text();
  return { status: resposta.status, corpo: texto ? JSON.parse(texto) : null };
}

async function etapa(descricao, metodo, caminho, corpo, statusEsperado = [200, 201]) {
  passo += 1;
  const r = await chamar(metodo, caminho, corpo);
  const esperado = [statusEsperado].flat();
  if (!esperado.includes(r.status)) {
    console.error(`\n✗ ${passo}. ${descricao}\n  ${metodo} ${caminho} → ${r.status} (esperado ${esperado.join('/')})`);
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

console.log(`Fluxo MVP contra ${API}\n`);

// 1. Listar mesas
const mesas = await etapa('Listar mesas', 'GET', '/mesas');
const mesa = mesas.find((m) => m.status === 'LIVRE');
confirmar(mesa, 'nenhuma mesa LIVRE (rode o seed)');

const garcons = await chamar('GET', '/usuarios?perfil=GARCOM');
const garcomId = garcons.corpo?.[0]?.id;

// 2. Abrir comanda
const comanda = await etapa('Abrir comanda', 'POST', '/comandas', {
  mesaId: mesa.id,
  garcomId,
  nomeCliente: 'Cliente de teste',
});
confirmar(comanda.status === 'ABERTA', 'comanda deveria estar ABERTA');

// 3. Consultar comanda
const consultada = await etapa('Consultar comanda', 'GET', `/comandas/${comanda.id}`);
confirmar(consultada.mesa.status === 'OCUPADA', 'mesa deveria estar OCUPADA');

// 4. Listar produtos
const produtos = await etapa('Listar produtos', 'GET', '/produtos?disponivel=true');
confirmar(produtos.length >= 2, 'são necessários ao menos 2 produtos');

// 5. Criar pedido com itens
const pedido = await etapa('Criar pedido com itens', 'POST', '/pedidos', {
  comandaId: comanda.id,
  criadoPorId: garcomId,
  observacao: 'Mesa com criança',
  itens: [
    { produtoId: produtos[0].id, quantidade: 2, observacao: 'sem sal' },
    { produtoId: produtos[1].id, quantidade: 1 },
  ],
});
confirmar(pedido.status === 'PENDENTE', 'pedido deveria nascer PENDENTE');

// 6. Consultar pedidos da cozinha
const fila = await etapa('Consultar pedidos da cozinha', 'GET', '/pedidos/cozinha');
confirmar(fila.some((p) => p.id === pedido.id), 'pedido deveria estar na fila da cozinha');

// 7–9. Ciclo de vida do pedido
await etapa('Pedido PENDENTE → EM_PREPARO', 'PATCH', `/pedidos/${pedido.id}/status`, { status: 'EM_PREPARO' });
await etapa('Pedido EM_PREPARO → PRONTO', 'PATCH', `/pedidos/${pedido.id}/status`, { status: 'PRONTO' });
await etapa('Pedido PRONTO → ENTREGUE', 'PATCH', `/pedidos/${pedido.id}/status`, { status: 'ENTREGUE' });

// 10. Solicitar fechamento
const solicitada = await etapa('Solicitar fechamento', 'POST', `/comandas/${comanda.id}/solicitar-fechamento`);
confirmar(solicitada.status === 'FECHAMENTO_SOLICITADO', 'status deveria ser FECHAMENTO_SOLICITADO');

// 11. Fechar comanda
const fechada = await etapa('Fechar comanda', 'POST', `/comandas/${comanda.id}/fechar`);
confirmar(fechada.status === 'FECHADA', 'comanda deveria estar FECHADA');
const esperado = (Number(produtos[0].preco) * 2 + Number(produtos[1].preco)).toFixed(2);
confirmar(fechada.total === esperado, `total deveria ser ${esperado}, veio ${fechada.total}`);

// 12. Mesa voltou para LIVRE
const mesaFinal = await etapa('Verificar mesa LIVRE', 'GET', `/mesas/${mesa.id}`);
confirmar(mesaFinal.status === 'LIVRE', 'mesa deveria ter voltado para LIVRE');

console.log(`\nFluxo principal OK — comanda ${comanda.id}, total R$ ${fechada.total}.`);
console.log('\nRegras de negócio (devem ser recusadas):\n');

const outra = mesas.find((m) => m.status === 'LIVRE' && m.id !== mesa.id) ?? mesa;
const c2 = await etapa('Abrir comanda para os testes de regra', 'POST', '/comandas', { mesaId: outra.id });
await etapa('Recusa 2ª comanda na mesma mesa', 'POST', '/comandas', { mesaId: outra.id }, 409);
await etapa('Recusa pedido sem itens', 'POST', '/pedidos', { comandaId: c2.id, itens: [] }, 400);
await etapa('Recusa campo desconhecido', 'POST', '/pedidos', { comandaId: c2.id, itens: [{ produtoId: produtos[0].id, quantidade: 1 }], hack: true }, 400);
await etapa('Recusa produto inexistente', 'POST', '/pedidos', { comandaId: c2.id, itens: [{ produtoId: 999999, quantidade: 1 }] }, 404);
const p2 = await etapa('Criar pedido para os testes de regra', 'POST', '/pedidos', { comandaId: c2.id, itens: [{ produtoId: produtos[0].id, quantidade: 1 }] });
await etapa('Recusa pular de PENDENTE para PRONTO', 'PATCH', `/pedidos/${p2.id}/status`, { status: 'PRONTO' }, 409);
await etapa('Recusa fechar com pedido pendente', 'POST', `/comandas/${c2.id}/fechar`, undefined, 409);
await etapa('Recusa cancelar comanda com pedido ativo', 'POST', `/comandas/${c2.id}/cancelar`, undefined, 409);
await etapa('Cancelar pedido PENDENTE', 'PATCH', `/pedidos/${p2.id}/status`, { status: 'CANCELADO' });
await etapa('Solicitar fechamento (regra)', 'POST', `/comandas/${c2.id}/solicitar-fechamento`);
await etapa('Recusa pedido após solicitar fechamento', 'POST', '/pedidos', { comandaId: c2.id, itens: [{ produtoId: produtos[0].id, quantidade: 1 }] }, 409);
const c2Cancelada = await etapa('Cancelar comanda sem pedidos ativos', 'POST', `/comandas/${c2.id}/cancelar`);
confirmar(c2Cancelada.mesa.status === 'LIVRE', 'mesa da comanda cancelada deveria estar LIVRE');
await etapa('Recusa id inválido', 'GET', '/comandas/abc', undefined, 400);
await etapa('Comanda inexistente → 404', 'GET', '/comandas/999999', undefined, 404);

console.log('\nTodas as verificações passaram.');
