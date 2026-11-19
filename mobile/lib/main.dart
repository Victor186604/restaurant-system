import 'dart:async';

import 'package:flutter/material.dart';

import 'app.dart';
import 'estado/sessao.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final sessao = Sessao();
  unawaited(sessao.restaurar());
  runApp(SessaoScope(sessao: sessao, child: const RestauranteApp()));
}
