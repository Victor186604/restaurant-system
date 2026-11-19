import 'package:flutter/material.dart';

import '../componentes/conteudo_assincrono.dart';
import '../componentes/estados.dart';
import '../estado/sessao.dart';
import '../modelos/modelos.dart';
import '../nucleo/api_exception.dart';
import '../nucleo/formato.dart';
import '../tema.dart';

/// Monta um pedido a partir do cardápio disponível e envia para a cozinha.
/// Devolve o [Pedido] criado pela API ao fechar a tela.
class NovoPedidoTela extends StatefulWidget {
  const NovoPedidoTela({super.key, required this.comandaId, required this.mesaNumero});

  final int comandaId;
  final int mesaNumero;

  @override
  State<NovoPedidoTela> createState() => _NovoPedidoTelaState();
}

class _NovoPedidoTelaState extends State<NovoPedidoTela> {
  static const int _maximoPorItem = 99;

  final Map<int, int> _quantidades = <int, int>{};
  final Map<int, String> _observacoes = <int, String>{};
  final _observacaoPedido = TextEditingController();
  List<Produto> _produtos = const <Produto>[];
  bool _enviando = false;

  @override
  void dispose() {
    _observacaoPedido.dispose();
    super.dispose();
  }

  Future<List<Produto>> _carregar() async {
    final produtos = await SessaoScope.ler(context).api.cardapio();
    if (mounted) setState(() => _produtos = produtos);
    return produtos;
  }

  int get _totalItens => _quantidades.values.fold(0, (soma, q) => soma + q);

  /// Estimativa para o garçom conferir; o valor oficial é calculado pela API.
  int get _totalEstimado {
    var total = 0;
    for (final produto in _produtos) {
      final quantidade = _quantidades[produto.id] ?? 0;
      if (quantidade > 0) total += centavos(produto.preco) * quantidade;
    }
    return total;
  }

  void _alterar(Produto produto, int delta) {
    setState(() {
      var quantidade = (_quantidades[produto.id] ?? 0) + delta;
      if (quantidade < 0) quantidade = 0;
      if (quantidade > _maximoPorItem) quantidade = _maximoPorItem;
      if (quantidade == 0) {
        _quantidades.remove(produto.id);
        _observacoes.remove(produto.id);
      } else {
        _quantidades[produto.id] = quantidade;
      }
    });
  }

  Future<void> _editarObservacao(Produto produto) async {
    final controlador = TextEditingController(text: _observacoes[produto.id] ?? '');
    final texto = await showDialog<String>(
      context: context,
      builder: (contexto) => AlertDialog(
        title: Text('Observação: ${produto.nome}'),
        content: TextField(
          controller: controlador,
          autofocus: true,
          maxLength: 300,
          decoration: const InputDecoration(hintText: 'Ex.: sem cebola, ao ponto'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(contexto).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(contexto).pop(controlador.text.trim()),
            child: const Text('Salvar'),
          ),
        ],
      ),
    );
    controlador.dispose();
    if (texto == null || !mounted) return;
    setState(() {
      if (texto.isEmpty) {
        _observacoes.remove(produto.id);
      } else {
        _observacoes[produto.id] = texto;
      }
    });
  }

  Future<void> _enviar() async {
    if (_enviando || _quantidades.isEmpty) return;
    setState(() => _enviando = true);
    final api = SessaoScope.ler(context).api;
    final itens = _quantidades.entries
        .map(
          (entrada) => ItemNovoPedido(
            produtoId: entrada.key,
            quantidade: entrada.value,
            observacao: _observacoes[entrada.key],
          ),
        )
        .toList();
    try {
      final pedido = await api.criarPedido(
        widget.comandaId,
        itens,
        observacao: _observacaoPedido.text,
      );
      if (!mounted) return;
      Navigator.of(context).pop(pedido);
    } on ApiException catch (e) {
      if (!mounted || e.naoAutorizado) return;
      setState(() => _enviando = false);
      mostrarMensagem(context, e.mensagem, erro: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Novo pedido · Mesa ${widget.mesaNumero}')),
      body: ConteudoAssincrono<List<Produto>>(
        carregar: _carregar,
        estaVazio: (produtos) => produtos.isEmpty,
        vazio: const EstadoVazio(
          titulo: 'Nenhum produto disponível agora',
          mensagem: 'A gerência controla o cardápio no painel web.',
          icone: Icons.restaurant_menu,
        ),
        construir: (context, produtos, recarregar) => _lista(context, produtos),
      ),
      bottomNavigationBar: _barraEnvio(context),
    );
  }

  Widget _lista(BuildContext context, List<Produto> produtos) {
    final textos = Theme.of(context).textTheme;
    final filhos = <Widget>[];
    int? categoriaAtual;
    // A API devolve os produtos ordenados por categoria.
    for (final produto in produtos) {
      if (produto.categoriaId != categoriaAtual) {
        categoriaAtual = produto.categoriaId;
        filhos.add(
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 6),
            child: Text(
              produto.categoriaNome,
              style: textos.titleSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: Cores.grafite,
              ),
            ),
          ),
        );
      }
      filhos.add(
        _LinhaProduto(
          produto: produto,
          quantidade: _quantidades[produto.id] ?? 0,
          observacao: _observacoes[produto.id],
          aoAlterar: (delta) => _alterar(produto, delta),
          aoObservar: () => _editarObservacao(produto),
        ),
      );
    }
    filhos.add(
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
        child: TextField(
          controller: _observacaoPedido,
          maxLength: 500,
          maxLines: 2,
          decoration: const InputDecoration(
            labelText: 'Observação do pedido (opcional)',
            hintText: 'Ex.: servir junto, mesa com criança',
          ),
        ),
      ),
    );
    return ListView(physics: const AlwaysScrollableScrollPhysics(), children: filhos);
  }

  Widget _barraEnvio(BuildContext context) {
    final textos = Theme.of(context).textTheme;
    final itens = _totalItens;
    return Material(
      color: Colors.white,
      elevation: 8,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      itens == 1 ? '1 item' : '$itens itens',
                      style: textos.bodyMedium?.copyWith(color: Cores.texto2),
                    ),
                    Text(
                      formatarCentavos(_totalEstimado),
                      style: textos.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
              FilledButton.icon(
                onPressed: itens == 0 || _enviando ? null : _enviar,
                icon: _enviando
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send),
                label: Text(_enviando ? 'Enviando…' : 'Enviar para a cozinha'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LinhaProduto extends StatelessWidget {
  const _LinhaProduto({
    required this.produto,
    required this.quantidade,
    required this.aoAlterar,
    required this.aoObservar,
    this.observacao,
  });

  final Produto produto;
  final int quantidade;
  final String? observacao;
  final ValueChanged<int> aoAlterar;
  final VoidCallback aoObservar;

  @override
  Widget build(BuildContext context) {
    final textos = Theme.of(context).textTheme;
    final selecionado = quantidade > 0;
    return Container(
      color: selecionado ? Cores.manjericaoClaro : Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 10, 8, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      produto.nome,
                      style: textos.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    if (produto.descricao != null)
                      Text(
                        produto.descricao!,
                        style: textos.bodySmall?.copyWith(color: Cores.texto2),
                      ),
                    const SizedBox(height: 2),
                    Text(formatarMoeda(produto.preco)),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Remover um ${produto.nome}',
                onPressed: selecionado ? () => aoAlterar(-1) : null,
                icon: const Icon(Icons.remove_circle_outline),
              ),
              SizedBox(
                width: 28,
                child: Text(
                  '$quantidade',
                  textAlign: TextAlign.center,
                  style: textos.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                ),
              ),
              IconButton(
                tooltip: 'Adicionar um ${produto.nome}',
                onPressed: () => aoAlterar(1),
                icon: const Icon(Icons.add_circle, color: Cores.grafite),
              ),
            ],
          ),
          if (selecionado)
            TextButton.icon(
              onPressed: aoObservar,
              icon: const Icon(Icons.edit_note, size: 20),
              label: Text(
                observacao == null ? 'Adicionar observação' : 'Obs.: $observacao',
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
      ),
    );
  }
}
