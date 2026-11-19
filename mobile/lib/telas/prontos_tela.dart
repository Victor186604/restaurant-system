import 'package:flutter/material.dart';

import '../componentes/conteudo_assincrono.dart';
import '../componentes/estados.dart';
import '../estado/sessao.dart';
import '../modelos/modelos.dart';
import '../nucleo/api_exception.dart';
import '../nucleo/config.dart';
import '../nucleo/formato.dart';
import '../tema.dart';
import 'comanda_tela.dart';

/// Pedidos que a cozinha marcou como prontos, aguardando o garçom levar.
class ProntosTela extends StatelessWidget {
  const ProntosTela({super.key, this.aoContar});

  /// Informa a quantidade de prontos (para o selo da navegação).
  final ValueChanged<int>? aoContar;

  @override
  Widget build(BuildContext context) {
    final sessao = SessaoScope.ler(context);
    return ConteudoAssincrono<List<Pedido>>(
      carregar: () async {
        final pedidos = await sessao.api.prontos();
        aoContar?.call(pedidos.length);
        return pedidos;
      },
      atualizarACada: Config.intervaloAtualizacao,
      estaVazio: (pedidos) => pedidos.isEmpty,
      vazio: const EstadoVazio(
        titulo: 'Nenhum prato aguardando',
        mensagem: 'Quando a cozinha marcar um pedido como pronto, ele aparece aqui.',
        icone: Icons.check_circle_outline,
      ),
      construir: (context, pedidos, recarregar) => ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: pedidos.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, indice) => _CartaoPronto(
          pedido: pedidos[indice],
          meu: pedidos[indice].criadoPorId == sessao.usuario?.id,
          recarregar: recarregar,
        ),
      ),
    );
  }
}

class _CartaoPronto extends StatefulWidget {
  const _CartaoPronto({required this.pedido, required this.meu, required this.recarregar});

  final Pedido pedido;
  final bool meu;
  final Recarregar recarregar;

  @override
  State<_CartaoPronto> createState() => _CartaoProntoState();
}

class _CartaoProntoState extends State<_CartaoPronto> {
  bool _enviando = false;

  Future<void> _entregar() async {
    if (_enviando) return;
    setState(() => _enviando = true);
    final api = SessaoScope.ler(context).api;
    final pedido = widget.pedido;
    try {
      await api.alterarStatus(pedido.id, StatusPedido.entregue);
      if (mounted) {
        mostrarMensagem(context, 'Pedido #${pedido.id} entregue na mesa ${pedido.mesaNumero ?? '?'}.');
      }
    } on ApiException catch (e) {
      if (mounted && !e.naoAutorizado) mostrarMensagem(context, e.mensagem, erro: true);
    }
    if (mounted) setState(() => _enviando = false);
    await widget.recarregar();
  }

  Future<void> _abrirComanda() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => ComandaTela(comandaId: widget.pedido.comandaId)),
    );
    await widget.recarregar();
  }

  @override
  Widget build(BuildContext context) {
    final pedido = widget.pedido;
    final textos = Theme.of(context).textTheme;
    final desde = pedido.prontoEm ?? pedido.criadoEm;
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: _abrirComanda,
        child: Container(
          decoration: const BoxDecoration(
            border: Border(left: BorderSide(color: Cores.manjericao, width: 6)),
          ),
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    'Mesa ${pedido.mesaNumero ?? '?'}',
                    style: textos.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Pedido #${pedido.id}',
                      style: textos.bodyMedium?.copyWith(color: Cores.texto2),
                    ),
                  ),
                  if (widget.meu)
                    const Text(
                      'Seu pedido',
                      style: TextStyle(color: Cores.manjericao, fontWeight: FontWeight.w700),
                    ),
                ],
              ),
              Text(
                'Pronto ${tempoDecorrido(desde)}'
                '${pedido.nomeCliente == null ? '' : ' · ${pedido.nomeCliente}'}',
                style: textos.bodySmall?.copyWith(color: Cores.texto2),
              ),
              const SizedBox(height: 8),
              for (final item in pedido.itens)
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: '${item.quantidade}× ',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      TextSpan(text: item.produtoNome),
                      if (item.observacao != null)
                        TextSpan(
                          text: ' — ${item.observacao}',
                          style: const TextStyle(color: Cores.tomate),
                        ),
                    ],
                  ),
                ),
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton.icon(
                  onPressed: _enviando ? null : _entregar,
                  style: FilledButton.styleFrom(backgroundColor: Cores.manjericao),
                  icon: _enviando
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.done),
                  label: const Text('Marcar entregue'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
