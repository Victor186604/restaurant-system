import 'dart:async';

import 'package:flutter/material.dart';

import '../nucleo/api_exception.dart';
import 'estados.dart';

typedef Recarregar = Future<void> Function();

/// Carrega dados da API e cuida, de forma padronizada, dos estados de
/// carregamento, erro, lista vazia, "puxar para atualizar" e atualização
/// automática periódica (só enquanto a tela está visível).
class ConteudoAssincrono<T> extends StatefulWidget {
  const ConteudoAssincrono({
    super.key,
    required this.carregar,
    required this.construir,
    this.estaVazio,
    this.vazio,
    this.atualizarACada,
  });

  final Future<T> Function() carregar;

  /// Deve devolver um widget rolável (ListView, CustomScrollView...)
  /// ou uma coluna que contenha um.
  final Widget Function(BuildContext context, T dados, Recarregar recarregar) construir;
  final bool Function(T dados)? estaVazio;
  final Widget? vazio;
  final Duration? atualizarACada;

  @override
  State<ConteudoAssincrono<T>> createState() => _ConteudoAssincronoState<T>();
}

class _ConteudoAssincronoState<T> extends State<ConteudoAssincrono<T>> {
  late T _dados;
  bool _temDados = false;
  bool _carregando = true;
  bool _buscando = false;
  bool _repetir = false;
  String? _erro;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _carregar();
    final intervalo = widget.atualizarACada;
    if (intervalo != null) {
      _timer = Timer.periodic(intervalo, (_) => _atualizarSozinho());
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _atualizarSozinho() {
    if (!mounted) return;
    // Não atualiza quando outra tela está por cima desta.
    final visivel = ModalRoute.of(context)?.isCurrent ?? true;
    if (visivel) _carregar(mostrarCarregando: false, mostrarErro: false);
  }

  Future<void> _recarregar() => _carregar(mostrarCarregando: false);

  Future<void> _carregar({bool mostrarCarregando = true, bool mostrarErro = true}) async {
    if (!mounted) return;
    if (_buscando) {
      _repetir = true;
      return;
    }
    _buscando = true;
    if (mostrarCarregando && (!_carregando || _erro != null)) {
      setState(() {
        _carregando = true;
        _erro = null;
      });
    }
    try {
      final dados = await widget.carregar();
      if (!mounted) return;
      setState(() {
        _dados = dados;
        _temDados = true;
        _carregando = false;
        _erro = null;
      });
    } on ApiException catch (e) {
      if (!mounted || e.naoAutorizado) return; // 401: a sessão volta ao login
      setState(() {
        _carregando = false;
        if (mostrarErro) _erro = e.mensagem;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _carregando = false;
        if (mostrarErro) _erro = 'Resposta inesperada da API: $e';
      });
    } finally {
      _buscando = false;
      if (_repetir && mounted) {
        _repetir = false;
        unawaited(_carregar(mostrarCarregando: false));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final erro = _erro;
    if (!_temDados) {
      if (erro != null) {
        return EstadoErro(mensagem: erro, aoTentarDeNovo: () => _carregar());
      }
      return const Carregando();
    }

    final vazio = widget.estaVazio?.call(_dados) ?? false;
    final conteudo = RefreshIndicator(
      onRefresh: _recarregar,
      child: vazio
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [widget.vazio ?? const EstadoVazio(titulo: 'Nada por aqui')],
            )
          : widget.construir(context, _dados, _recarregar),
    );
    if (erro == null) return conteudo;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: AvisoErro(mensagem: erro, aoFechar: () => setState(() => _erro = null)),
        ),
        Expanded(child: conteudo),
      ],
    );
  }
}
