import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:restaurante_garcom/nucleo/token_storage.dart';

/// Lê uma resposta real da API capturada em test/fixtures.
Object? fixture(String nome) =>
    jsonDecode(File('test/fixtures/$nome.json').readAsStringSync());

/// Resposta JSON em UTF-8 (como a da API NestJS).
http.Response respostaJson(Object? corpo, int status) => http.Response(
      jsonEncode(corpo),
      status,
      headers: {'content-type': 'application/json; charset=utf-8'},
    );

/// Armazenamento em memória no lugar do flutter_secure_storage nos testes.
class ArmazenamentoMemoria extends TokenStorage {
  ArmazenamentoMemoria([this.valor]);

  String? valor;

  @override
  Future<String?> ler() async {
    return valor;
  }

  @override
  Future<void> salvar(String token) async {
    valor = token;
  }

  @override
  Future<void> apagar() async {
    valor = null;
  }
}
