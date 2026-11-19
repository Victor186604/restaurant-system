import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'estado/sessao.dart';
import 'telas/inicio_tela.dart';
import 'telas/login_tela.dart';
import 'tema.dart';

final GlobalKey<NavigatorState> navegadorKey = GlobalKey<NavigatorState>();

class RestauranteApp extends StatefulWidget {
  const RestauranteApp({super.key});

  @override
  State<RestauranteApp> createState() => _RestauranteAppState();
}

class _RestauranteAppState extends State<RestauranteApp> {
  Sessao? _sessao;
  EstadoSessao? _anterior;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final sessao = SessaoScope.ler(context);
    if (!identical(sessao, _sessao)) {
      _sessao?.removeListener(_aoMudarSessao);
      _sessao = sessao;
      sessao.addListener(_aoMudarSessao);
      _anterior = sessao.estado;
    }
  }

  void _aoMudarSessao() {
    final estado = _sessao!.estado;
    // Saiu ou a sessão expirou: fecha as telas abertas sobre a tela inicial,
    // para o login aparecer mesmo se o garçom estava dentro de uma comanda.
    if (_anterior == EstadoSessao.logado && estado != EstadoSessao.logado) {
      navegadorKey.currentState?.popUntil((rota) => rota.isFirst);
    }
    _anterior = estado;
  }

  @override
  void dispose() {
    _sessao?.removeListener(_aoMudarSessao);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Restaurante — Garçom',
      debugShowCheckedModeBanner: false,
      navigatorKey: navegadorKey,
      theme: criarTema(),
      locale: const Locale('pt', 'BR'),
      supportedLocales: const [Locale('pt', 'BR')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: const _Portao(),
    );
  }
}

/// Decide a primeira tela a partir do estado da sessão (rota protegida).
class _Portao extends StatelessWidget {
  const _Portao();

  @override
  Widget build(BuildContext context) {
    final sessao = SessaoScope.of(context);
    switch (sessao.estado) {
      case EstadoSessao.iniciando:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case EstadoSessao.deslogado:
        return const LoginTela();
      case EstadoSessao.logado:
        return InicioTela(key: ValueKey<int>(sessao.usuario!.id));
    }
  }
}
