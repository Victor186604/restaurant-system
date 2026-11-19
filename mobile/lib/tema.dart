import 'package:flutter/material.dart';

/// Mesma paleta do painel web (grafite + cores de estado da cozinha).
class Cores {
  Cores._();

  static const Color grafite = Color(0xFF1F2A33);
  static const Color papel = Color(0xFFF4F6F5);
  static const Color linha = Color(0xFFD9DFDC);
  static const Color texto2 = Color(0xFF55636E);
  static const Color tomate = Color(0xFFB8392A);
  static const Color tomateClaro = Color(0xFFFBE9E6);
  static const Color acafrao = Color(0xFF8A5508);
  static const Color acafraoClaro = Color(0xFFFDF1D8);
  static const Color manjericao = Color(0xFF2C6E4F);
  static const Color manjericaoClaro = Color(0xFFE3F1E9);
  static const Color grafiteClaro = Color(0xFFDFE6EA);
  static const Color neutroClaro = Color(0xFFECEFF1);
}

ThemeData criarTema() {
  final esquema = ColorScheme.fromSeed(
    seedColor: Cores.grafite,
    primary: Cores.grafite,
    surface: Colors.white,
    error: Cores.tomate,
  );
  return ThemeData(
    colorScheme: esquema,
    scaffoldBackgroundColor: Cores.papel,
    appBarTheme: const AppBarTheme(
      backgroundColor: Cores.grafite,
      foregroundColor: Colors.white,
      centerTitle: false,
    ),
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(),
      filled: true,
      fillColor: Colors.white,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(minimumSize: const Size(64, 48)),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(minimumSize: const Size(64, 48)),
    ),
    snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
  );
}
