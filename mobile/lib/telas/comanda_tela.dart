import 'package:flutter/material.dart';

import '../componentes/conteudo_assincrono.dart';
import '../componentes/estados.dart';
import '../componentes/selo.dart';
import '../estado/sessao.dart';
import '../modelos/modelos.dart';
import '../nucleo/api_exception.dart';
import '../nucleo/config.dart';
import '../nucleo/formato.dart';
import '../tema.dart';
import 'novo_pedido_tela.dart';

/// Comanda da mesa: pedidos, valores calculados pela API e ações do garçom
/// (novo pedido, entregar, cancelar pedido pendente, pedir a conta).
class ComandaTela extends StatefulWidget {
  const ComandaTela({super.key, required this.comandaId});

  final int comandaId;

  @override
  State<ComandaTela> createState() => _ComandaTelaState();
}

class _ComandaTelaState extends State<ComandaTela> {
  bool _ocupado = false;
  int? _mesaNumero;

  Future<Comanda> _carregar() async {
    final comanda = await SessaoScope.ler(context).api.comanda(widget.comandaId);
    if (mounted && comanda.mesaNumero != _mesaNumero) {
      setState(() => _mesaNumero = comanda.mesaNumero);
    }
    return comanda;
  }

  /// Executa uma ação na API, avisa o resultado e recarrega a comanda.
  Future<void> _executar(
    Future<void> Function() acao,
    String sucesso,
    Recarregar recarregar,
  ) async {
    if (_ocupado) return;
    setState(() => _ocupado = true);
    try {
      await acao();
      if (mounted) mostrarMensagem(context, sucesso);
    } on ApiException catch (e) {
      if (mounted && !e.naoAutorizado) mostrarMensagem(context, e.mensagem, erro: true);
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
    if (mounted) await recarregar();
  }

  Future<void> _novoPedido(Comanda comanda, Recarregar recarregar) async {
    final criado = await Navigator.of(context).push<Pedido>(
      MaterialPageRoute<Pedido>(
        builder: (_) => NovoPedidoTela(comandaId: comanda.id, mesaNumero: comanda.mesaNumero),
      ),
    );
    if (!mounted) return;
    if (criado != null) {
      mostrarMensagem(context, 'Pedido #${criado.id} enviado para a cozinha.');
    }
    await recarregar();
  }

  Future<void> _entregar(Pedido pedido, Recarregar recarregar) {
    final api = SessaoScope.ler(context).api;
    return _executar(
      () async {
        await api.alterarStatus(pedido.id, StatusPedido.entregue);
      },
      'Pedido #${pedido.id} entregue.',
      recarregar,
    );
  }

  Future<void> _cancelar(Pedido pedido, Recarregar recarregar) async {
    final api = SessaoScope.ler(context).api;
    final confirmado = await _confirmar(
      titulo: 'Cancelar o pedido #${pedido.id}?',
      mensagem: 'A cozinha ainda não começou o preparo. O pedido sai da fila e não entra na conta.',
      acao: 'Cancelar pedido',
    );
    if (!confirmado || !mounted) return;
    await _executar(
      () async {
        await api.alterarStatus(pedido.id, StatusPedido.cancelado);
      },
      'Pedido #${pedido.id} cancelado.',
      recarregar,
    );
  }

  Future<void> _pedirConta(Comanda comanda, Recarregar recarregar) async {
    final api = SessaoScope.ler(context).api;
    final pendentes = comanda.resumo.pedidosPendentesDeEntrega;
    final confirmado = await _confirmar(
      titulo: 'Pedir a conta da mesa ${comanda.mesaNumero}?',
      mensagem: [
        'Valor previsto: ${formatarMoeda(comanda.resumo.valorPrevisto)}.',
        if (pendentes > 0)
          'Atenção: $pendentes pedido(s) ainda não entregue(s). '
              'A gerência só fecha a comanda depois da entrega.',
        'Depois disso não é possível lançar novos pedidos nesta comanda.',
      ].join('\n\n'),
      acao: 'Pedir a conta',
    );
    if (!confirmado || !mounted) return;
    await _executar(
      () async {
        await api.solicitarFechamento(comanda.id);
      },
      'Conta pedida. A comanda agora aparece para a gerência fechar.',
      recarregar,
    );
  }

  Future<bool> _confirmar({
    required String titulo,
    required String mensagem,
    required String acao,
  }) async {
    final resposta = await showDialog<bool>(
      context: context,
      builder: (contexto) => AlertDialog(
        title: Text(titulo),
        content: Text(mensagem),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(contexto).pop(false),
            child: const Text('Voltar'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(contexto).pop(true),
            child: Text(acao),
          ),
        ],
      ),
    );
    return resposta ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final titulo = _mesaNumero == null
        ? 'Comanda #${widget.comandaId}'
        : 'Mesa $_mesaNumero · Comanda #${widget.comandaId}';
    return Scaffold(
      appBar: AppBar(title: Text(titulo)),
      body: ConteudoAssincrono<Comanda>(
        carregar: _carregar,
        atualizarACada: Config.intervaloAtualizacao,
        construir: (context, comanda, recarregar) => _conteudo(context, comanda, recarregar),
      ),
    );
  }

  Widget _conteudo(BuildContext context, Comanda comanda, Recarregar recarregar) {
    final textos = Theme.of(context).textTheme;
    // Mais recentes primeiro.
    final pedidos = comanda.pedidos.reversed.toList();
    return Column(
      children: [
        Expanded(
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              _CabecalhoComanda(comanda: comanda),
              const SizedBox(height: 20),
              Text(
                'Pedidos',
                style: textos.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              if (pedidos.isEmpty)
                const EstadoVazio(
                  titulo: 'Nenhum pedido ainda',
                  mensagem: 'Toque em "Novo pedido" para lançar o primeiro.',
                  icone: Icons.receipt_long_outlined,
                )
              else
                for (final pedido in pedidos)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _CartaoPedido(
                      pedido: pedido,
                      ocupado: _ocupado,
                      aoEntregar: () => _entregar(pedido, recarregar),
                      aoCancelar: () => _cancelar(pedido, recarregar),
                    ),
                  ),
            ],
          ),
        ),
        _BarraAcoes(
          comanda: comanda,
          ocupado: _ocupado,
          aoNovoPedido: () => _novoPedido(comanda, recarregar),
          aoPedirConta: () => _pedirConta(comanda, recarregar),
        ),
      ],
    );
  }
}

class _CabecalhoComanda extends StatelessWidget {
  const _CabecalhoComanda({required this.comanda});

  final Comanda comanda;

  @override
  Widget build(BuildContext context) {
    final textos = Theme.of(context).textTheme;
    final fechada = comanda.status == StatusComanda.fechada;
    final resumo = comanda.resumo;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Cores.linha),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  comanda.nomeCliente ?? 'Cliente sem nome',
                  style: textos.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              Selo.comanda(comanda.status),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Aberta às ${formatarHora(comanda.abertaEm)}'
            '${comanda.garcomNome == null ? '' : ' por ${comanda.garcomNome}'}',
            style: textos.bodyMedium?.copyWith(color: Cores.texto2),
          ),
          const Divider(height: 28),
          _LinhaValor(rotulo: 'Entregue', valor: formatarMoeda(resumo.valorEntregue)),
          _LinhaValor(rotulo: 'Em andamento', valor: formatarMoeda(resumo.valorEmAndamento)),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Expanded(
                child: Text(fechada ? 'Total' : 'Total previsto', style: textos.titleSmall),
              ),
              Text(
                formatarMoeda(fechada ? comanda.total : resumo.valorPrevisto),
                style: textos.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
              ),
            ],
          ),
          Text(
            'Valores calculados pelo sistema.',
            style: textos.bodySmall?.copyWith(color: Cores.texto2),
          ),
        ],
      ),
    );
  }
}

class _LinhaValor extends StatelessWidget {
  const _LinhaValor({required this.rotulo, required this.valor});

  final String rotulo;
  final String valor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(child: Text(rotulo, style: const TextStyle(color: Cores.texto2))),
          Text(valor),
        ],
      ),
    );
  }
}

class _CartaoPedido extends StatelessWidget {
  const _CartaoPedido({
    required this.pedido,
    required this.ocupado,
    required this.aoEntregar,
    required this.aoCancelar,
  });

  final Pedido pedido;
  final bool ocupado;
  final VoidCallback aoEntregar;
  final VoidCallback aoCancelar;

  @override
  Widget build(BuildContext context) {
    final textos = Theme.of(context).textTheme;
    final cancelado = pedido.status == StatusPedido.cancelado;
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: pedido.status == StatusPedido.pronto ? Cores.manjericao : Cores.linha,
          width: pedido.status == StatusPedido.pronto ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Pedido #${pedido.id} · ${formatarHora(pedido.criadoEm)}',
                  style: textos.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              Selo.pedido(pedido.status),
            ],
          ),
          const SizedBox(height: 8),
          for (final item in pedido.itens)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 34,
                    child: Text(
                      '${item.quantidade}×',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.produtoNome,
                          style: cancelado
                              ? const TextStyle(decoration: TextDecoration.lineThrough)
                              : null,
                        ),
                        if (item.observacao != null)
                          Text(
                            item.observacao!,
                            style: const TextStyle(
                              color: Cores.tomate,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                      ],
                    ),
                  ),
                  Text(formatarMoeda(item.subtotal)),
                ],
              ),
            ),
          if (pedido.observacao != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(top: 6),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Cores.acafraoClaro,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text('Obs.: ${pedido.observacao}'),
            ),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Total do pedido: ${formatarMoeda(pedido.total)}',
                  style: textos.bodyMedium?.copyWith(color: Cores.texto2),
                ),
              ),
              if (pedido.status == StatusPedido.pronto)
                FilledButton.icon(
                  onPressed: ocupado ? null : aoEntregar,
                  style: FilledButton.styleFrom(backgroundColor: Cores.manjericao),
                  icon: const Icon(Icons.done),
                  label: const Text('Entregar'),
                )
              else if (pedido.status == StatusPedido.pendente)
                TextButton(
                  onPressed: ocupado ? null : aoCancelar,
                  style: TextButton.styleFrom(foregroundColor: Cores.tomate),
                  child: const Text('Cancelar pedido'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BarraAcoes extends StatelessWidget {
  const _BarraAcoes({
    required this.comanda,
    required this.ocupado,
    required this.aoNovoPedido,
    required this.aoPedirConta,
  });

  final Comanda comanda;
  final bool ocupado;
  final VoidCallback aoNovoPedido;
  final VoidCallback aoPedirConta;

  @override
  Widget build(BuildContext context) {
    final Widget conteudo;
    switch (comanda.status) {
      case StatusComanda.aberta:
        conteudo = Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: ocupado ? null : aoPedirConta,
                icon: const Icon(Icons.receipt_long_outlined),
                label: const Text('Pedir a conta'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton.icon(
                onPressed: ocupado ? null : aoNovoPedido,
                icon: const Icon(Icons.add),
                label: const Text('Novo pedido'),
              ),
            ),
          ],
        );
      case StatusComanda.fechamentoSolicitado:
        conteudo = Text(
          'Conta pedida às ${formatarHora(comanda.fechamentoSolicitadoEm)}. '
          'A gerência fecha a comanda no painel.',
          textAlign: TextAlign.center,
        );
      case StatusComanda.fechada:
        conteudo = Text(
          'Comanda fechada às ${formatarHora(comanda.fechadaEm)}. Mesa liberada.',
          textAlign: TextAlign.center,
        );
      case StatusComanda.cancelada:
        conteudo = const Text('Comanda cancelada.', textAlign: TextAlign.center);
    }
    return Material(
      color: Colors.white,
      elevation: 8,
      child: SafeArea(
        top: false,
        child: Padding(padding: const EdgeInsets.all(16), child: conteudo),
      ),
    );
  }
}
