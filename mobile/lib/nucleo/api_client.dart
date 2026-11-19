import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_exception.dart';

/// Cliente HTTP central: toda comunicação com a API passa por aqui.
///
/// - acrescenta o cabeçalho `Authorization: Bearer <token>`;
/// - converte respostas de erro em [ApiException] com a mensagem da API;
/// - avisa a sessão ([aoExpirar]) quando a API recusa o token (401).
class ApiClient {
  ApiClient({
    required String baseUrl,
    required this.lerToken,
    this.aoExpirar,
    http.Client? cliente,
  })  : baseUrl = baseUrl.replaceAll(RegExp(r'/+$'), ''),
        _cliente = cliente ?? http.Client();

  final String baseUrl;
  final String? Function() lerToken;
  final void Function()? aoExpirar;
  final http.Client _cliente;

  static const Duration tempoLimite = Duration(seconds: 15);

  Future<Object?> get(String caminho) => _enviar('GET', caminho);

  Future<Object?> post(String caminho, {Object? corpo, bool autenticar = true}) =>
      _enviar('POST', caminho, corpo: corpo, autenticar: autenticar);

  Future<Object?> patch(String caminho, {Object? corpo}) =>
      _enviar('PATCH', caminho, corpo: corpo);

  Future<Object?> _enviar(
    String metodo,
    String caminho, {
    Object? corpo,
    bool autenticar = true,
  }) async {
    final cabecalhos = <String, String>{'Accept': 'application/json'};
    if (corpo != null) {
      cabecalhos['Content-Type'] = 'application/json; charset=utf-8';
    }
    if (autenticar) {
      final token = lerToken();
      if (token == null) {
        throw const ApiException(401, 'Sessão expirada. Entre novamente.');
      }
      cabecalhos['Authorization'] = 'Bearer $token';
    }

    final requisicao = http.Request(metodo, Uri.parse('$baseUrl$caminho'))
      ..headers.addAll(cabecalhos);
    if (corpo != null) {
      requisicao.body = jsonEncode(corpo);
    }

    final http.Response resposta;
    try {
      final fluxo = await _cliente.send(requisicao).timeout(tempoLimite);
      resposta = await http.Response.fromStream(fluxo).timeout(tempoLimite);
    } on TimeoutException {
      throw const ApiException(
        0,
        'A API demorou demais para responder. Verifique a conexão e tente de novo.',
      );
    } catch (_) {
      throw ApiException(
        0,
        'Não foi possível conectar à API ($baseUrl). Verifique se o backend está '
        'rodando e se o endereço está correto.',
      );
    }

    final texto = utf8.decode(resposta.bodyBytes, allowMalformed: true);
    Object? dados;
    if (texto.isNotEmpty) {
      try {
        dados = jsonDecode(texto);
      } on FormatException {
        dados = texto;
      }
    }

    final status = resposta.statusCode;
    if (status >= 200 && status < 300) return dados;
    if (status == 401 && autenticar) aoExpirar?.call();
    throw ApiException(status, _mensagemDeErro(dados, status));
  }

  static String _mensagemDeErro(Object? dados, int status) {
    if (dados is Map) {
      final mensagem = dados['message'];
      if (mensagem is List) return mensagem.join(' ');
      if (mensagem is String && mensagem.isNotEmpty) return mensagem;
    }
    return 'A API respondeu com erro $status.';
  }

  void fechar() => _cliente.close();
}
