import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:restaurante_garcom/nucleo/api_client.dart';
import 'package:restaurante_garcom/nucleo/api_exception.dart';

import 'apoio.dart';

void main() {
  test('envia o token Bearer e devolve o JSON', () async {
    late http.Request recebida;
    final api = ApiClient(
      baseUrl: 'http://api.teste/api/',
      lerToken: () => 'abc',
      cliente: MockClient((requisicao) async {
        recebida = requisicao;
        return respostaJson(fixture('mesas'), 200);
      }),
    );

    final dados = await api.get('/mesas');

    expect(recebida.url.toString(), 'http://api.teste/api/mesas');
    expect(recebida.headers['Authorization'], 'Bearer abc');
    expect(dados, isA<List<dynamic>>());
  });

  test('401 da API encerra a sessão', () async {
    var expirou = false;
    final api = ApiClient(
      baseUrl: 'http://api.teste/api',
      lerToken: () => 'vencido',
      aoExpirar: () => expirou = true,
      cliente: MockClient((_) async => respostaJson(fixture('erro_401'), 401)),
    );

    await expectLater(
      api.get('/mesas'),
      throwsA(isA<ApiException>().having((e) => e.status, 'status', 401)),
    );
    expect(expirou, isTrue);
  });

  test('senha errada no login não é tratada como sessão expirada', () async {
    var expirou = false;
    final api = ApiClient(
      baseUrl: 'http://api.teste/api',
      lerToken: () => null,
      aoExpirar: () => expirou = true,
      cliente: MockClient((_) async => respostaJson(fixture('login_invalido'), 401)),
    );

    await expectLater(
      api.post('/auth/login', corpo: {'email': 'a@b.c', 'senha': 'x'}, autenticar: false),
      throwsA(
        isA<ApiException>().having((e) => e.mensagem, 'mensagem', 'E-mail ou senha inválidos.'),
      ),
    );
    expect(expirou, isFalse);
  });

  test('usa a mensagem da API em erros de permissão (403) e de validação (400)', () async {
    final respostas = [
      respostaJson(fixture('erro_403'), 403),
      respostaJson(fixture('erro_400'), 400),
    ];
    final api = ApiClient(
      baseUrl: 'http://api.teste/api',
      lerToken: () => 't',
      cliente: MockClient((_) async => respostas.removeAt(0)),
    );

    await expectLater(
      api.post('/comandas/3/fechar'),
      throwsA(
        isA<ApiException>()
            .having((e) => e.status, 'status', 403)
            .having((e) => e.mensagem, 'mensagem', contains('não tem permissão')),
      ),
    );
    await expectLater(
      api.post('/pedidos', corpo: {'comandaId': 3, 'itens': <Object>[]}),
      throwsA(
        isA<ApiException>().having(
          (e) => e.mensagem,
          'mensagem',
          'O pedido deve ter pelo menos um item.',
        ),
      ),
    );
  });

  test('sem conexão vira erro com status 0', () async {
    final api = ApiClient(
      baseUrl: 'http://api.teste/api',
      lerToken: () => 't',
      cliente: MockClient((_) async => throw http.ClientException('falhou')),
    );

    await expectLater(
      api.get('/mesas'),
      throwsA(isA<ApiException>().having((e) => e.semConexao, 'semConexao', isTrue)),
    );
  });
}
