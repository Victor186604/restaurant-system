/// Erro devolvido pela API (ou falta de conexão com ela).
class ApiException implements Exception {
  const ApiException(this.status, this.mensagem);

  /// Código HTTP; 0 quando não houve resposta (sem conexão, tempo esgotado).
  final int status;

  /// Mensagem pronta para exibir (a da própria API, quando houver).
  final String mensagem;

  bool get naoAutorizado => status == 401;
  bool get semConexao => status == 0;

  @override
  String toString() => mensagem;
}
