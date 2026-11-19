import '../modelos/modelos.dart';
import '../nucleo/api_client.dart';

/// Endpoints da API usados pelo aplicativo do garçom (docs/contrato-api.md).
/// Nenhuma regra de negócio aqui: só chamadas HTTP e conversão do JSON.
class RestauranteApi {
  RestauranteApi(this._http);

  final ApiClient _http;

  String get baseUrl => _http.baseUrl;

  // ---- Autenticação
  Future<RespostaLogin> login(String email, String senha) async {
    final dados = await _http.post(
      '/auth/login',
      corpo: {'email': email, 'senha': senha},
      autenticar: false,
    );
    return RespostaLogin.fromJson(dados as Json);
  }

  Future<Usuario> me() async =>
      Usuario.fromJson(await _http.get('/auth/me') as Json);

  // ---- Salão
  Future<List<Mesa>> mesas() async =>
      _lista(await _http.get('/mesas'), Mesa.fromJson);

  // ---- Comandas
  Future<Comanda> abrirComanda(int mesaId, {String? nomeCliente}) async {
    final nome = nomeCliente?.trim() ?? '';
    final dados = await _http.post(
      '/comandas',
      corpo: {'mesaId': mesaId, if (nome.isNotEmpty) 'nomeCliente': nome},
    );
    return Comanda.fromJson(dados as Json);
  }

  Future<Comanda> comanda(int id) async =>
      Comanda.fromJson(await _http.get('/comandas/$id') as Json);

  Future<Comanda> solicitarFechamento(int id) async => Comanda.fromJson(
        await _http.post('/comandas/$id/solicitar-fechamento') as Json,
      );

  // ---- Cardápio
  Future<List<Produto>> cardapio() async =>
      _lista(await _http.get('/produtos?disponivel=true'), Produto.fromJson);

  // ---- Pedidos
  Future<Pedido> criarPedido(
    int comandaId,
    List<ItemNovoPedido> itens, {
    String? observacao,
  }) async {
    final obs = observacao?.trim() ?? '';
    final dados = await _http.post(
      '/pedidos',
      corpo: {
        'comandaId': comandaId,
        if (obs.isNotEmpty) 'observacao': obs,
        'itens': itens.map((item) => item.toJson()).toList(),
      },
    );
    return Pedido.fromJson(dados as Json);
  }

  Future<List<Pedido>> prontos() async =>
      _lista(await _http.get('/pedidos?status=PRONTO'), Pedido.fromJson);

  /// O garçom usa ENTREGUE e CANCELADO; a API valida perfil e transição.
  Future<Pedido> alterarStatus(int pedidoId, StatusPedido status) async {
    final dados = await _http.patch(
      '/pedidos/$pedidoId/status',
      corpo: {'status': status.api},
    );
    return Pedido.fromJson(dados as Json);
  }

  static List<T> _lista<T>(Object? dados, T Function(Json json) converter) =>
      (dados as List).map((item) => converter(item as Json)).toList();
}
