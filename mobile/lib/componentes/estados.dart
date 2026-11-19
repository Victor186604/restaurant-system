import 'package:flutter/material.dart';

import '../tema.dart';

/// Indicador de carregamento centralizado.
class Carregando extends StatelessWidget {
  const Carregando({super.key});

  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator());
}

/// Lista vazia: explica o que significa e o que fazer.
class EstadoVazio extends StatelessWidget {
  const EstadoVazio({
    super.key,
    required this.titulo,
    this.mensagem,
    this.icone = Icons.inbox_outlined,
  });

  final String titulo;
  final String? mensagem;
  final IconData icone;

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icone, size: 48, color: Cores.texto2),
          const SizedBox(height: 12),
          Text(titulo, textAlign: TextAlign.center, style: tema.titleMedium),
          if (mensagem != null) ...[
            const SizedBox(height: 8),
            Text(
              mensagem!,
              textAlign: TextAlign.center,
              style: tema.bodyMedium?.copyWith(color: Cores.texto2),
            ),
          ],
        ],
      ),
    );
  }
}

/// Falha ao carregar uma tela inteira, com opção de tentar de novo.
class EstadoErro extends StatelessWidget {
  const EstadoErro({super.key, required this.mensagem, required this.aoTentarDeNovo});

  final String mensagem;
  final VoidCallback aoTentarDeNovo;

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context).textTheme;
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 48, color: Cores.tomate),
            const SizedBox(height: 12),
            Text(
              'Não foi possível carregar',
              textAlign: TextAlign.center,
              style: tema.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              mensagem,
              textAlign: TextAlign.center,
              style: tema.bodyMedium?.copyWith(color: Cores.texto2),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: aoTentarDeNovo,
              icon: const Icon(Icons.refresh),
              label: const Text('Tentar de novo'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Faixa de erro sobre um conteúdo que continua visível.
class AvisoErro extends StatelessWidget {
  const AvisoErro({super.key, required this.mensagem, this.aoFechar});

  final String mensagem;
  final VoidCallback? aoFechar;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true,
      child: Container(
        decoration: BoxDecoration(
          color: Cores.tomateClaro,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFE7B3AB)),
        ),
        padding: const EdgeInsets.fromLTRB(14, 10, 4, 10),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: Cores.tomate),
            const SizedBox(width: 10),
            Expanded(
              child: Text(mensagem, style: const TextStyle(color: Color(0xFF7D2117))),
            ),
            if (aoFechar != null)
              IconButton(
                tooltip: 'Fechar aviso',
                onPressed: aoFechar,
                icon: const Icon(Icons.close, size: 20),
              ),
          ],
        ),
      ),
    );
  }
}

/// Mensagem rápida de sucesso ou erro (SnackBar).
void mostrarMensagem(BuildContext context, String texto, {bool erro = false}) {
  final mensageiro = ScaffoldMessenger.of(context);
  mensageiro.hideCurrentSnackBar();
  mensageiro.showSnackBar(
    SnackBar(
      content: Text(texto),
      backgroundColor: erro ? Cores.tomate : Cores.grafite,
    ),
  );
}
