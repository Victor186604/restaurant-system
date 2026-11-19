// Formatação para exibição. Os valores monetários chegam da API como texto
// com 2 casas ("64.90") e são convertidos para centavos inteiros, sem
// ponto flutuante.

/// "64.90" → 6490. Texto inválido → 0.
int centavos(String valor) {
  final partes = valor.trim().split('.');
  final inteiro = int.tryParse(partes[0]) ?? 0;
  var decimais = 0;
  if (partes.length > 1) {
    decimais = int.tryParse('${partes[1]}00'.substring(0, 2)) ?? 0;
  }
  return inteiro * 100 + decimais;
}

/// 123450 → "R$ 1.234,50".
String formatarCentavos(int valor) {
  final negativo = valor < 0;
  final absoluto = valor.abs();
  final reais = (absoluto ~/ 100).toString();
  final resto = (absoluto % 100).toString().padLeft(2, '0');
  final grupos = StringBuffer();
  for (var i = 0; i < reais.length; i++) {
    if (i > 0 && (reais.length - i) % 3 == 0) grupos.write('.');
    grupos.write(reais[i]);
  }
  return '${negativo ? '-' : ''}R\$ $grupos,$resto';
}

/// "1234.5" → "R$ 1.234,50"; null → "—".
String formatarMoeda(String? valor) =>
    valor == null ? '—' : formatarCentavos(centavos(valor));

String _doisDigitos(int n) => n.toString().padLeft(2, '0');

/// Hora local "HH:MM"; null → "—".
String formatarHora(DateTime? data) {
  if (data == null) return '—';
  final local = data.toLocal();
  return '${_doisDigitos(local.hour)}:${_doisDigitos(local.minute)}';
}

/// Minutos inteiros desde [data] (nunca negativo).
int minutosDesde(DateTime data, [DateTime? agora]) {
  final minutos = (agora ?? DateTime.now()).difference(data).inMinutes;
  return minutos < 0 ? 0 : minutos;
}

/// "há 3 min", "agora".
String tempoDecorrido(DateTime data, [DateTime? agora]) {
  final minutos = minutosDesde(data, agora);
  return minutos == 0 ? 'agora' : 'há $minutos min';
}
