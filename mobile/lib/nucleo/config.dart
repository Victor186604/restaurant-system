import 'package:flutter/foundation.dart';

/// Configuração do aplicativo.
///
/// A URL da API pode ser definida na execução:
///   flutter run --dart-define=API_URL=http://192.168.0.10:3000/api
class Config {
  Config._();

  static const String _apiUrlDefinida = String.fromEnvironment('API_URL');

  /// URL base da API NestJS, com o prefixo /api.
  static String get apiUrl {
    if (_apiUrlDefinida.isNotEmpty) return _apiUrlDefinida;
    // No emulador Android, 10.0.2.2 é o "localhost" do computador.
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000/api';
    }
    return 'http://localhost:3000/api';
  }

  /// Intervalo da atualização automática das listas (mesas, prontos, comanda).
  static const Duration intervaloAtualizacao = Duration(seconds: 15);
}
