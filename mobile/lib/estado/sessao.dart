import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:http/http.dart' as http;

import '../modelos/modelos.dart';
import '../nucleo/api_client.dart';
import '../nucleo/api_exception.dart';
import '../nucleo/config.dart';
import '../nucleo/token_storage.dart';
import '../servicos/restaurante_api.dart';

enum EstadoSessao { iniciando, deslogado, logado }

/// Estado global de autenticação: token, usuário e acesso à API.
///
/// - [restaurar]: na abertura do app, lê o token salvo e confere com GET /auth/me;
/// - [entrar]: POST /auth/login e guarda o token no armazenamento seguro;
/// - [sair]: apaga o token;
/// - qualquer 401 da API encerra a sessão e volta ao login.
class Sessao extends ChangeNotifier {
  Sessao({TokenStorage? armazenamento, String? baseUrl, http.Client? cliente})
      : _armazenamento = armazenamento ?? TokenStorage() {
    api = RestauranteApi(
      ApiClient(
        baseUrl: baseUrl ?? Config.apiUrl,
        lerToken: () => _token,
        aoExpirar: _expirar,
        cliente: cliente,
      ),
    );
  }

  late final RestauranteApi api;
  final TokenStorage _armazenamento;

  String? _token;
  Usuario? _usuario;
  EstadoSessao _estado = EstadoSessao.iniciando;
  String? _avisoLogin;

  EstadoSessao get estado => _estado;
  Usuario? get usuario => _usuario;

  /// Mensagem para a tela de login (ex.: sessão expirada).
  String? get avisoLogin => _avisoLogin;

  Future<void> restaurar() async {
    String? salvo;
    try {
      salvo = await _armazenamento.ler();
    } catch (_) {
      salvo = null;
    }
    if (salvo == null) {
      _definir(EstadoSessao.deslogado);
      return;
    }

    _token = salvo;
    try {
      final usuario = await api.me();
      if (!usuario.perfil.usaAplicativo) {
        await _limpar();
        _definir(EstadoSessao.deslogado);
        return;
      }
      _usuario = usuario;
      _definir(EstadoSessao.logado);
    } on ApiException catch (e) {
      // 401: _expirar() já limpou a sessão e definiu o aviso.
      if (!e.naoAutorizado) {
        _token = null;
        _avisoLogin = e.mensagem;
        _definir(EstadoSessao.deslogado);
      }
    }
  }

  /// Devolve null em caso de sucesso, ou a mensagem de erro para a tela.
  Future<String?> entrar(String email, String senha) async {
    final RespostaLogin resposta;
    try {
      resposta = await api.login(email.trim().toLowerCase(), senha);
    } on ApiException catch (e) {
      if (e.status == 401) return 'E-mail ou senha inválidos.';
      return e.mensagem;
    }

    final perfil = resposta.usuario.perfil;
    if (!perfil.usaAplicativo) {
      return 'Este aplicativo é do salão. O perfil ${perfil.rotulo} usa o painel web.';
    }

    _token = resposta.token;
    _usuario = resposta.usuario;
    _avisoLogin = null;
    try {
      await _armazenamento.salvar(resposta.token);
    } catch (_) {
      // Sem armazenamento seguro disponível: a sessão vale até fechar o app.
    }
    _definir(EstadoSessao.logado);
    return null;
  }

  Future<void> sair() async {
    _avisoLogin = null;
    await _limpar();
    _definir(EstadoSessao.deslogado);
  }

  void _expirar() {
    if (_token == null) return;
    _avisoLogin = 'Sua sessão expirou. Entre novamente.';
    unawaited(_limpar());
    _definir(EstadoSessao.deslogado);
  }

  Future<void> _limpar() async {
    _token = null;
    _usuario = null;
    try {
      await _armazenamento.apagar();
    } catch (_) {
      // Nada a fazer: o token já foi descartado da memória.
    }
  }

  void _definir(EstadoSessao estado) {
    _estado = estado;
    notifyListeners();
  }
}

/// Disponibiliza a [Sessao] para a árvore de widgets.
class SessaoScope extends InheritedNotifier<Sessao> {
  const SessaoScope({super.key, required Sessao sessao, required super.child})
      : super(notifier: sessao);

  /// Lê a sessão e reconstrói o widget quando ela muda.
  static Sessao of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<SessaoScope>()!.notifier!;

  /// Lê a sessão sem se inscrever nas mudanças (para chamadas à API).
  static Sessao ler(BuildContext context) =>
      context.getInheritedWidgetOfExactType<SessaoScope>()!.notifier!;
}
