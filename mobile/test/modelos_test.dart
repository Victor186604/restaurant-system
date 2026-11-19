import 'package:flutter_test/flutter_test.dart';
import 'package:restaurante_garcom/modelos/modelos.dart';

import 'apoio.dart';

void main() {
  test('login: token e usuário garçom', () {
    final resposta = RespostaLogin.fromJson(fixture('login') as Json);
    expect(resposta.token, isNotEmpty);
    expect(resposta.expiraEmSegundos, 28800);
    expect(resposta.usuario.perfil, Perfil.garcom);
    expect(resposta.usuario.perfil.usaAplicativo, isTrue);
  });

  test('mesas: situação derivada da comanda ativa', () {
    final mesas = (fixture('mesas') as List)
        .map((m) => Mesa.fromJson(m as Json))
        .toList();
    expect(mesas, hasLength(10));
    final mesa5 = mesas.firstWhere((m) => m.numero == 5);
    expect(mesa5.situacao, SituacaoMesa.ocupada);
    expect(mesa5.comandaAtiva?.nomeCliente, 'Ana');
    expect(mesas.firstWhere((m) => m.numero == 2).situacao, SituacaoMesa.livre);

    final aguardando = Mesa.fromJson(<String, dynamic>{
      'id': 9,
      'numero': 9,
      'capacidade': 4,
      'status': 'OCUPADA',
      'comandaAtiva': {
        'id': 1,
        'status': 'FECHAMENTO_SOLICITADO',
        'abertaEm': '2026-11-19T18:00:00.000Z',
        'nomeCliente': null,
      },
    });
    expect(aguardando.situacao, SituacaoMesa.aguardandoFechamento);
  });

  test('cardápio: produtos com categoria e preço em texto', () {
    final produtos = (fixture('produtos') as List)
        .map((p) => Produto.fromJson(p as Json))
        .toList();
    expect(produtos, isNotEmpty);
    expect(produtos.first.categoriaNome, isNotEmpty);
    expect(produtos.every((p) => p.disponivel), isTrue);
    expect(RegExp(r'^\d+\.\d{2}$').hasMatch(produtos.first.preco), isTrue);
  });

  test('comanda: pedidos, itens e resumo calculado pela API', () {
    final comanda = Comanda.fromJson(fixture('comanda_detalhe') as Json);
    expect(comanda.status, StatusComanda.aberta);
    expect(comanda.mesaNumero, 5);
    expect(comanda.garcomNome, 'Garçom João');
    expect(comanda.pedidos, hasLength(1));

    final pedido = comanda.pedidos.single;
    expect(pedido.status, StatusPedido.pronto);
    expect(pedido.observacao, 'Sem pressa');
    expect(pedido.itens.first.quantidade, 2);
    expect(pedido.itens.first.observacao, 'ao ponto');
    expect(pedido.itens.first.subtotal, '129.80');

    expect(comanda.resumo.valorPrevisto, '136.80');
    expect(comanda.resumo.pedidosPendentesDeEntrega, 1);
    expect(comanda.resumo.podeFechar, isFalse);
  });

  test('conta pedida muda o status da comanda', () {
    final comanda = Comanda.fromJson(fixture('comanda_conta_pedida') as Json);
    expect(comanda.status, StatusComanda.fechamentoSolicitado);
    expect(comanda.fechamentoSolicitadoEm, isNotNull);
  });

  test('prontos: lista traz a mesa de cada pedido', () {
    final prontos = (fixture('prontos') as List)
        .map((p) => Pedido.fromJson(p as Json))
        .toList();
    expect(prontos, hasLength(1));
    expect(prontos.single.mesaNumero, 5);
    expect(prontos.single.nomeCliente, 'Ana');
    expect(prontos.single.prontoEm, isNotNull);
  });

  test('item novo omite observação vazia', () {
    expect(
      const ItemNovoPedido(produtoId: 4, quantidade: 2, observacao: '  ').toJson(),
      {'produtoId': 4, 'quantidade': 2},
    );
    expect(
      const ItemNovoPedido(produtoId: 4, quantidade: 1, observacao: 'sem sal').toJson(),
      {'produtoId': 4, 'quantidade': 1, 'observacao': 'sem sal'},
    );
  });
}
