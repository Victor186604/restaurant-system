import 'package:flutter/material.dart';

import '../estado/sessao.dart';
import 'mesas_tela.dart';
import 'prontos_tela.dart';

/// Tela principal após o login: abas "Mesas" e "Prontos".
class InicioTela extends StatefulWidget {
  const InicioTela({super.key});

  @override
  State<InicioTela> createState() => _InicioTelaState();
}

class _InicioTelaState extends State<InicioTela> {
  int _aba = 0;
  int _prontos = 0;

  void _contarProntos(int quantidade) {
    if (mounted && quantidade != _prontos) setState(() => _prontos = quantidade);
  }

  @override
  Widget build(BuildContext context) {
    final sessao = SessaoScope.of(context);
    final usuario = sessao.usuario;

    return Scaffold(
      appBar: AppBar(
        title: Text(_aba == 0 ? 'Mesas' : 'Prontos para servir'),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Minha conta',
            icon: const Icon(Icons.account_circle_outlined),
            onSelected: (opcao) {
              if (opcao == 'sair') sessao.sair();
            },
            itemBuilder: (context) => <PopupMenuEntry<String>>[
              PopupMenuItem<String>(
                enabled: false,
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(usuario?.nome ?? ''),
                  subtitle: Text(usuario?.perfil.rotulo ?? ''),
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem<String>(
                value: 'sair',
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.logout),
                  title: Text('Sair'),
                ),
              ),
            ],
          ),
        ],
      ),
      // IndexedStack mantém as duas abas vivas: a de prontos continua
      // atualizando o contador mesmo com a aba de mesas aberta.
      body: IndexedStack(
        index: _aba,
        children: [
          const MesasTela(),
          ProntosTela(aoContar: _contarProntos),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _aba,
        onDestinationSelected: (indice) => setState(() => _aba = indice),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.table_restaurant_outlined),
            selectedIcon: Icon(Icons.table_restaurant),
            label: 'Mesas',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: _prontos > 0,
              label: Text('$_prontos'),
              child: const Icon(Icons.notifications_none),
            ),
            selectedIcon: Badge(
              isLabelVisible: _prontos > 0,
              label: Text('$_prontos'),
              child: const Icon(Icons.notifications),
            ),
            label: 'Prontos',
          ),
        ],
      ),
    );
  }
}
