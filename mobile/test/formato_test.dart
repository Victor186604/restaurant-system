import 'package:flutter_test/flutter_test.dart';
import 'package:restaurante_garcom/nucleo/formato.dart';

void main() {
  test('converte texto da API em centavos sem ponto flutuante', () {
    expect(centavos('64.90'), 6490);
    expect(centavos('7.00'), 700);
    expect(centavos('5'), 500);
    expect(centavos('12.5'), 1250);
  });

  test('formata moeda em reais', () {
    expect(formatarMoeda('136.80'), r'R$ 136,80');
    expect(formatarMoeda('1234.5'), r'R$ 1.234,50');
    expect(formatarMoeda('0.00'), r'R$ 0,00');
    expect(formatarMoeda(null), '—');
    expect(formatarCentavos(123456789), r'R$ 1.234.567,89');
  });

  test('tempo decorrido', () {
    final agora = DateTime.utc(2026, 11, 19, 18, 30);
    expect(tempoDecorrido(agora, agora), 'agora');
    expect(tempoDecorrido(DateTime.utc(2026, 11, 19, 18, 18), agora), 'há 12 min');
    expect(minutosDesde(DateTime.utc(2026, 11, 19, 18, 40), agora), 0);
  });
}
