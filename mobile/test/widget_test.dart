import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:restaurante_garcom/app.dart';
import 'package:restaurante_garcom/estado/sessao.dart';

import 'apoio.dart';
import 'sessao_test.dart' show apiFalsa;

void main() {
  Future<Sessao> montar(WidgetTester tester) async {
    final sessao = Sessao(
      armazenamento: ArmazenamentoMemoria(),
      baseUrl: 'http://api.teste/api',
      cliente: apiFalsa(),
    );
    await sessao.restaurar();
    await tester.pumpWidget(SessaoScope(sessao: sessao, child: const RestauranteApp()));
    await tester.pumpAndSettle();
    return sessao;
  }

  testWidgets('login valida os campos obrigatórios', (tester) async {
    await montar(tester);

    await tester.tap(find.widgetWithText(FilledButton, 'Entrar'));
    await tester.pump();

    expect(find.text('Informe o e-mail.'), findsOneWidget);
    expect(find.text('Informe a senha.'), findsOneWidget);
  });

  testWidgets('senha errada exibe a mensagem da API', (tester) async {
    await montar(tester);

    await tester.enterText(find.byType(TextFormField).at(0), 'joao@restaurante.local');
    await tester.enterText(find.byType(TextFormField).at(1), 'errada');
    await tester.tap(find.widgetWithText(FilledButton, 'Entrar'));
    await tester.pumpAndSettle();

    expect(find.text('E-mail ou senha inválidos.'), findsOneWidget);
  });

  testWidgets('login válido abre as mesas vindas da API', (tester) async {
    final sessao = await montar(tester);

    await tester.enterText(find.byType(TextFormField).at(0), 'joao@restaurante.local');
    await tester.enterText(find.byType(TextFormField).at(1), 'senha123');
    await tester.tap(find.widgetWithText(FilledButton, 'Entrar'));
    await tester.pumpAndSettle();

    expect(sessao.estado, EstadoSessao.logado);
    expect(find.text('Mesa 5'), findsOneWidget);
    expect(find.text('Ocupada'), findsOneWidget);

    // Sair volta para o login.
    await tester.tap(find.byTooltip('Minha conta'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sair'));
    await tester.pumpAndSettle();
    expect(find.widgetWithText(FilledButton, 'Entrar'), findsOneWidget);
  });
}
