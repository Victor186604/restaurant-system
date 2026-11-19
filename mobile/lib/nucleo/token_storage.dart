import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Guarda o JWT em armazenamento seguro do sistema operacional
/// (Keystore no Android, Keychain no iOS), nunca em texto puro.
class TokenStorage {
  TokenStorage([FlutterSecureStorage? armazenamento])
      : _armazenamento = armazenamento ?? const FlutterSecureStorage();

  final FlutterSecureStorage _armazenamento;
  static const String _chave = 'restaurante_jwt';

  Future<String?> ler() => _armazenamento.read(key: _chave);

  Future<void> salvar(String token) =>
      _armazenamento.write(key: _chave, value: token);

  Future<void> apagar() => _armazenamento.delete(key: _chave);
}
