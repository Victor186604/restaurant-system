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

/// Salão: mesas da API com situação livre, ocupada ou conta pedida.
class MesasTela extends StatelessWidget {
  const MesasTela({super.key});

  @override
  Widget build(BuildContext context) {
    final api = SessaoScope.ler(context).api;
    return ConteudoAssincrono<List<Mesa>>(
      carregar: api.mesas,
      atualizarACada: Config.intervaloAtualizacao,
      estaVazio: (mesas) => mesas.isEmpty,
      vazio: const EstadoVazio(
        titulo: 'Nenhuma mesa cadastrada',
        mensagem: 'A gerência cadastra as mesas no sistema.',
        icone: Icons.table_restaurant_outlined,
      ),
      construir: (context, mesas, recarregar) =>
          _GradeMesas(mesas: mesas, recarregar: recarregar),
    );
  }
}

class _GradeMesas extends StatelessWidget {
  const _GradeMesas({required this.mesas, required this.recarregar});

  final List<Mesa> mesas;
  final Recarregar recarregar;

  int _contar(SituacaoMesa situacao) => mesas.where((m) => m.situacao == situacao).length;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          sliver: SliverToBoxAdapter(
            child: Wrap(
              spacing: 16,
              runSpacing: 8,
              children: [
                _Legenda(cor: Cores.manjericao, texto: 'Livres: ${_contar(SituacaoMesa.livre)}'),
                _Legenda(cor: Cores.grafite, texto: 'Ocupadas: ${_contar(SituacaoMesa.ocupada)}'),
                _Legenda(
                  cor: Cores.acafrao,
                  texto: 'Conta pedida: ${_contar(SituacaoMesa.aguardandoFechamento)}',
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 200,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              mainAxisExtent: 128,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, indice) => _CartaoMesa(
                mesa: mesas[indice],
                aoTocar: () => _abrirMesa(context, mesas[indice], recarregar),
              ),
              childCount: mesas.length,
            ),
          ),
        ),
      ],
    );
  }
}

/// Mesa ocupada → abre a comanda. Mesa livre → pergunta o nome e abre uma comanda.
Future<void> _abrirMesa(BuildContext context, Mesa mesa, Recarregar recarregar) async {
  final navegador = Navigator.of(context);
  final api = SessaoScope.ler(context).api;
  final ativa = mesa.comandaAtiva;

  if (ativa != null) {
    await navegador.push(
      MaterialPageRoute<void>(builder: (_) => ComandaTela(comandaId: ativa.id)),
    );
    await recarregar();
    return;
  }

  final nomeCliente = await showDialog<String>(
    context: context,
    builder: (_) => _DialogoAbrirComanda(mesa: mesa),
  );
  if (nomeCliente == null || !context.mounted) return;

  try {
    final comanda = await api.abrirComanda(mesa.id, nomeCliente: nomeCliente);
    if (context.mounted) {
      mostrarMensagem(context, 'Comanda #${comanda.id} aberta na mesa ${mesa.numero}.');
    }
    await navegador.push(
      MaterialPageRoute<void>(builder: (_) => ComandaTela(comandaId: comanda.id)),
    );
  } on ApiException catch (e) {
    if (context.mounted && !e.naoAutorizado) {
      mostrarMensagem(context, e.mensagem, erro: true);
    }
  }
  await recarregar();
}

class _DialogoAbrirComanda extends StatefulWidget {
  const _DialogoAbrirComanda({required this.mesa});

  final Mesa mesa;

  @override
  State<_DialogoAbrirComanda> createState() => _DialogoAbrirComandaState();
}

class _DialogoAbrirComandaState extends State<_DialogoAbrirComanda> {
  final _nome = TextEditingController();

  @override
  void dispose() {
    _nome.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Abrir comanda na mesa ${widget.mesa.numero}'),
      content: TextField(
        controller: _nome,
        autofocus: true,
        maxLength: 120,
        textCapitalization: TextCapitalization.words,
        decoration: const InputDecoration(
          labelText: 'Nome do cliente (opcional)',
          counterText: '',
        ),
        onSubmitted: (_) => Navigator.of(context).pop(_nome.text.trim()),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(_nome.text.trim()),
          child: const Text('Abrir comanda'),
        ),
      ],
    );
  }
}

class _Legenda extends StatelessWidget {
  const _Legenda({required this.cor, required this.texto});

  final Color cor;
  final String texto;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: cor, borderRadius: BorderRadius.circular(3)),
        ),
        const SizedBox(width: 6),
        Text(texto),
      ],
    );
  }
}

class _CartaoMesa extends StatelessWidget {
  const _CartaoMesa({required this.mesa, required this.aoTocar});

  final Mesa mesa;
  final VoidCallback aoTocar;

  Color get _cor {
    switch (mesa.situacao) {
      case SituacaoMesa.livre:
        return Cores.manjericao;
      case SituacaoMesa.ocupada:
        return Cores.grafite;
      case SituacaoMesa.aguardandoFechamento:
        return Cores.acafrao;
    }
  }

  Color get _fundo =>
      mesa.situacao == SituacaoMesa.aguardandoFechamento ? const Color(0xFFFFFAF0) : Colors.white;

  String get _detalhe {
    final ativa = mesa.comandaAtiva;
    if (ativa == null) return '${mesa.capacidade} lugares';
    final cliente = ativa.nomeCliente == null ? '' : ' · ${ativa.nomeCliente}';
    return 'Comanda #${ativa.id}$cliente\ndesde ${formatarHora(ativa.abertaEm)}';
  }

  @override
  Widget build(BuildContext context) {
    final textos = Theme.of(context).textTheme;
    return Material(
      color: _fundo,
      borderRadius: BorderRadius.circular(12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: aoTocar,
        child: Container(
          decoration: BoxDecoration(
            border: Border(left: BorderSide(color: _cor, width: 6)),
          ),
          padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Mesa ${mesa.numero}',
                style: textos.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 2),
              Text(
                mesa.situacao.rotulo,
                style: TextStyle(color: _cor, fontWeight: FontWeight.w700),
              ),
              const Spacer(),
              Text(
                _detalhe,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: textos.bodySmall?.copyWith(color: Cores.texto2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
