import 'package:flutter/material.dart';

import '../modelos/modelos.dart';
import '../tema.dart';

/// Selo colorido de status, com o mesmo vocabulário do painel web.
class Selo extends StatelessWidget {
  const Selo({super.key, required this.texto, required this.cor, required this.fundo});

  factory Selo.pedido(StatusPedido status) {
    switch (status) {
      case StatusPedido.pendente:
        return Selo(texto: status.rotulo, cor: Cores.tomate, fundo: Cores.tomateClaro);
      case StatusPedido.emPreparo:
        return Selo(texto: status.rotulo, cor: Cores.acafrao, fundo: Cores.acafraoClaro);
      case StatusPedido.pronto:
        return Selo(texto: status.rotulo, cor: Cores.manjericao, fundo: Cores.manjericaoClaro);
      case StatusPedido.entregue:
        return Selo(texto: status.rotulo, cor: Cores.grafite, fundo: Cores.grafiteClaro);
      case StatusPedido.cancelado:
        return Selo(texto: status.rotulo, cor: Cores.texto2, fundo: Cores.neutroClaro);
    }
  }

  factory Selo.comanda(StatusComanda status) {
    switch (status) {
      case StatusComanda.aberta:
        return Selo(texto: status.rotulo, cor: Cores.grafite, fundo: Cores.grafiteClaro);
      case StatusComanda.fechamentoSolicitado:
        return Selo(texto: status.rotulo, cor: Cores.acafrao, fundo: Cores.acafraoClaro);
      case StatusComanda.fechada:
        return Selo(texto: status.rotulo, cor: Cores.manjericao, fundo: Cores.manjericaoClaro);
      case StatusComanda.cancelada:
        return Selo(texto: status.rotulo, cor: Cores.texto2, fundo: Cores.neutroClaro);
    }
  }

  final String texto;
  final Color cor;
  final Color fundo;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: fundo, borderRadius: BorderRadius.circular(999)),
      child: Text(
        texto,
        style: TextStyle(color: cor, fontWeight: FontWeight.w700, fontSize: 12.5),
      ),
    );
  }
}
