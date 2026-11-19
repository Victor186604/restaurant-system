import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:restaurante_garcom/estado/sessao.dart';
import 'package:restaurante_garcom/modelos/modelos.dart';
import 'package:restaurante_garcom/nucleo/api_exception.dart';

import 'apoio.dart';

/// API falsa que responde com as fixtures reais.
MockClient apiFalsa({bool tokenValido = true, String perfil = 'GARCOM'}) {
  return MockClient((http.Request req) async {
    final caminho = req.url.path;
    if (caminho.endsWith('/auth/login')) {
      if (req.body.contains('"senha":"senha123"')) {
        final login = Map<String, dynamic>.from(fixture('login') as Map);
        login['usuario'] = {...(login['usuario'] as Map), 'perfil': perfil};
        return respostaJson(login, 200);
      }
      return respostaJson(fixture('login_invalido'), 401);
    }
    if (!tokenValido) return respostaJson(fixture('erro_401'), 401);
    if (caminho.endsWith('/auth/me')) {
      return respostaJson({...(fixture('me') as Map), 'perfil': perfil}, 200);
    }
    if (caminho.endsWith('/mesas')) return respostaJson(fixture('mesas'), 200);
    if (caminho.endsWith('/pedidos')) return respostaJson(fixture('prontos'), 200);
    return respostaJson({'message': 'Rota não simulada'}, 404);
  });
}

Sessao novaSessao(ArmazenamentoMemoria armazenamento, MockClient cliente) =>
    Sessao(armazenamento: armazenamento, baseUrl: 'http://api.teste/api', cliente: cliente);

void main() {
  test('sem token salvo, começa deslogado', () async {
    final sessao = novaSessao(ArmazenamentoMemoria(), apiFalsa());
    expect(sessao.estado, EstadoSessao.iniciando);
    await sessao.restaurar();
    expect(sessao.estado, EstadoSessao.deslogado);
  });

  test('login do garçom guarda o token e libera o app', () async {
    final armazenamento = ArmazenamentoMemoria();
    final sessao = novaSessao(armazenamento, apiFalsa());
    await sessao.restaurar();

    final erro = await sessao.entrar('joao@restaurante.local', 'senha123');

    expect(erro, isNull);
    expect(sessao.estado, EstadoSessao.logado);
    expect(sessao.usuario?.perfil, Perfil.garcom);
    expect(armazenamento.valor, isNotNull);
  });

  test('senha errada mostra mensagem e continua deslogado', () async {
    final sessao = novaSessao(ArmazenamentoMemoria(), apiFalsa());
    await sessao.restaurar();
    final erro = await sessao.entrar('joao@restaurante.local', 'errada');
    expect(erro, 'E-mail ou senha inválidos.');
    expect(sessao.estado, EstadoSessao.deslogado);
  });

  test('perfil da cozinha é orientado a usar o painel web', () async {
    final armazenamento = ArmazenamentoMemoria();
    final sessao = novaSessao(armazenamento, apiFalsa(perfil: 'COZINHA'));
    await sessao.restaurar();
    final erro = await sessao.entrar('cozinha@restaurante.local', 'senha123');
    expect(erro, contains('painel web'));
    expect(sessao.estado, EstadoSessao.deslogado);
    expect(armazenamento.valor, isNull);
  });

  test('token salvo e válido restaura a sessão sem novo login', () async {
    final sessao = novaSessao(ArmazenamentoMemoria('token-salvo'), apiFalsa());
    await sessao.restaurar();
    expect(sessao.estado, EstadoSessao.logado);
    expect(sessao.usuario?.nome, 'Garçom João');
  });

  test('token salvo vencido volta ao login com aviso e é apagado', () async {
    final armazenamento = ArmazenamentoMemoria('vencido');
    final sessao = novaSessao(armazenamento, apiFalsa(tokenValido: false));
    await sessao.restaurar();
    expect(sessao.estado, EstadoSessao.deslogado);
    expect(sessao.avisoLogin, contains('expirou'));
    expect(armazenamento.valor, isNull);
  });

  test('401 durante o uso encerra a sessão', () async {
    var valido = true;
    final cliente = MockClient((http.Request req) async {
      if (req.url.path.endsWith('/auth/login')) return respostaJson(fixture('login'), 200);
      return valido
          ? respostaJson(fixture('mesas'), 200)
          : respostaJson(fixture('erro_401'), 401);
    });
    final sessao = novaSessao(ArmazenamentoMemoria(), cliente);
    await sessao.restaurar();
    await sessao.entrar('joao@restaurante.local', 'senha123');
    expect(await sessao.api.mesas(), hasLength(10));

    valido = false;
    await expectLater(sessao.api.mesas(), throwsA(isA<ApiException>()));
    expect(sessao.estado, EstadoSessao.deslogado);
  });

  test('sair apaga o token', () async {
    final armazenamento = ArmazenamentoMemoria();
    final sessao = novaSessao(armazenamento, apiFalsa());
    await sessao.restaurar();
    await sessao.entrar('joao@restaurante.local', 'senha123');
    await sessao.sair();
    expect(sessao.estado, EstadoSessao.deslogado);
    expect(armazenamento.valor, isNull);
  });
}
