// Modelos das respostas da API NestJS (docs/contrato-api.md).
// Os campos seguem exatamente o JSON devolvido pela API (ver test/fixtures).
// Valores monetários permanecem como texto com 2 casas ("64.90"):
// todo cálculo oficial é feito pelo backend.

typedef Json = Map<String, dynamic>;

DateTime _data(Object? valor) => DateTime.parse(valor as String);

DateTime? _dataOuNula(Object? valor) =>
    valor == null ? null : DateTime.parse(valor as String);

// ---------------------------------------------------------------- Enums

enum Perfil {
  admin('ADMIN', 'Administrador'),
  gerente('GERENTE', 'Gerência'),
  garcom('GARCOM', 'Garçom'),
  cozinha('COZINHA', 'Cozinha');

  const Perfil(this.api, this.rotulo);

  final String api;
  final String rotulo;

  static Perfil daApi(String valor) => values.firstWhere(
        (p) => p.api == valor,
        orElse: () => throw FormatException('Perfil desconhecido: $valor'),
      );

  /// Perfis que a API autoriza nas rotas do garçom (contrato v2).
  bool get usaAplicativo => this != Perfil.cozinha;
}

enum StatusMesa {
  livre('LIVRE'),
  ocupada('OCUPADA');

  const StatusMesa(this.api);

  final String api;

  static StatusMesa daApi(String valor) => values.firstWhere(
        (s) => s.api == valor,
        orElse: () => throw FormatException('Status de mesa desconhecido: $valor'),
      );
}

enum StatusComanda {
  aberta('ABERTA', 'Aberta'),
  fechamentoSolicitado('FECHAMENTO_SOLICITADO', 'Conta pedida'),
  fechada('FECHADA', 'Fechada'),
  cancelada('CANCELADA', 'Cancelada');

  const StatusComanda(this.api, this.rotulo);

  final String api;
  final String rotulo;

  static StatusComanda daApi(String valor) => values.firstWhere(
        (s) => s.api == valor,
        orElse: () => throw FormatException('Status de comanda desconhecido: $valor'),
      );
}

enum StatusPedido {
  pendente('PENDENTE', 'Pendente'),
  emPreparo('EM_PREPARO', 'Em preparo'),
  pronto('PRONTO', 'Pronto'),
  entregue('ENTREGUE', 'Entregue'),
  cancelado('CANCELADO', 'Cancelado');

  const StatusPedido(this.api, this.rotulo);

  final String api;
  final String rotulo;

  static StatusPedido daApi(String valor) => values.firstWhere(
        (s) => s.api == valor,
        orElse: () => throw FormatException('Status de pedido desconhecido: $valor'),
      );
}

/// Situação exibida no salão (derivada do status da mesa e da comanda ativa).
enum SituacaoMesa {
  livre('Livre'),
  ocupada('Ocupada'),
  aguardandoFechamento('Conta pedida');

  const SituacaoMesa(this.rotulo);

  final String rotulo;
}

// ---------------------------------------------------------------- Usuário

class Usuario {
  const Usuario({
    required this.id,
    required this.nome,
    required this.email,
    required this.perfil,
  });

  factory Usuario.fromJson(Json json) => Usuario(
        id: json['id'] as int,
        nome: json['nome'] as String,
        email: json['email'] as String,
        perfil: Perfil.daApi(json['perfil'] as String),
      );

  final int id;
  final String nome;
  final String email;
  final Perfil perfil;
}

class RespostaLogin {
  const RespostaLogin({
    required this.token,
    required this.expiraEmSegundos,
    required this.usuario,
  });

  factory RespostaLogin.fromJson(Json json) => RespostaLogin(
        token: json['accessToken'] as String,
        expiraEmSegundos: json['expiresIn'] as int,
        usuario: Usuario.fromJson(json['usuario'] as Json),
      );

  final String token;
  final int expiraEmSegundos;
  final Usuario usuario;
}

// ---------------------------------------------------------------- Mesas

class ComandaAtiva {
  const ComandaAtiva({
    required this.id,
    required this.status,
    required this.abertaEm,
    this.nomeCliente,
  });

  factory ComandaAtiva.fromJson(Json json) => ComandaAtiva(
        id: json['id'] as int,
        status: StatusComanda.daApi(json['status'] as String),
        abertaEm: _data(json['abertaEm']),
        nomeCliente: json['nomeCliente'] as String?,
      );

  final int id;
  final StatusComanda status;
  final DateTime abertaEm;
  final String? nomeCliente;
}

class Mesa {
  const Mesa({
    required this.id,
    required this.numero,
    required this.capacidade,
    required this.status,
    this.comandaAtiva,
  });

  factory Mesa.fromJson(Json json) {
    final ativa = json['comandaAtiva'] as Json?;
    return Mesa(
      id: json['id'] as int,
      numero: json['numero'] as int,
      capacidade: json['capacidade'] as int,
      status: StatusMesa.daApi(json['status'] as String),
      comandaAtiva: ativa == null ? null : ComandaAtiva.fromJson(ativa),
    );
  }

  final int id;
  final int numero;
  final int capacidade;
  final StatusMesa status;
  final ComandaAtiva? comandaAtiva;

  SituacaoMesa get situacao {
    if (comandaAtiva?.status == StatusComanda.fechamentoSolicitado) {
      return SituacaoMesa.aguardandoFechamento;
    }
    if (status == StatusMesa.ocupada || comandaAtiva != null) {
      return SituacaoMesa.ocupada;
    }
    return SituacaoMesa.livre;
  }
}

// ---------------------------------------------------------------- Cardápio

class Produto {
  const Produto({
    required this.id,
    required this.nome,
    required this.preco,
    required this.categoriaId,
    required this.categoriaNome,
    required this.disponivel,
    this.descricao,
  });

  factory Produto.fromJson(Json json) {
    final categoria = json['categoria'] as Json;
    return Produto(
      id: json['id'] as int,
      nome: json['nome'] as String,
      descricao: json['descricao'] as String?,
      preco: json['preco'] as String,
      categoriaId: json['categoriaId'] as int,
      categoriaNome: categoria['nome'] as String,
      disponivel: json['disponivel'] as bool,
    );
  }

  final int id;
  final String nome;
  final String? descricao;
  final String preco;
  final int categoriaId;
  final String categoriaNome;
  final bool disponivel;
}

// ---------------------------------------------------------------- Pedidos

class ItemPedido {
  const ItemPedido({
    required this.id,
    required this.produtoId,
    required this.produtoNome,
    required this.quantidade,
    required this.precoUnitario,
    required this.subtotal,
    this.observacao,
  });

  factory ItemPedido.fromJson(Json json) {
    final produto = json['produto'] as Json;
    return ItemPedido(
      id: json['id'] as int,
      produtoId: json['produtoId'] as int,
      produtoNome: produto['nome'] as String,
      quantidade: json['quantidade'] as int,
      precoUnitario: json['precoUnitario'] as String,
      subtotal: json['subtotal'] as String,
      observacao: json['observacao'] as String?,
    );
  }

  final int id;
  final int produtoId;
  final String produtoNome;
  final int quantidade;
  final String precoUnitario;
  final String subtotal;
  final String? observacao;
}

class Pedido {
  const Pedido({
    required this.id,
    required this.comandaId,
    required this.status,
    required this.criadoEm,
    required this.itens,
    required this.total,
    this.observacao,
    this.iniciadoEm,
    this.prontoEm,
    this.entregueEm,
    this.criadoPorId,
    this.criadoPorNome,
    this.mesaNumero,
    this.nomeCliente,
  });

  factory Pedido.fromJson(Json json) {
    final criadoPor = json['criadoPor'] as Json?;
    // Listagens (ex.: /pedidos?status=PRONTO) trazem a comanda com a mesa.
    final comanda = json['comanda'] as Json?;
    final mesa = comanda?['mesa'] as Json?;
    return Pedido(
      id: json['id'] as int,
      comandaId: json['comandaId'] as int,
      status: StatusPedido.daApi(json['status'] as String),
      observacao: json['observacao'] as String?,
      criadoEm: _data(json['criadoEm']),
      iniciadoEm: _dataOuNula(json['iniciadoEm']),
      prontoEm: _dataOuNula(json['prontoEm']),
      entregueEm: _dataOuNula(json['entregueEm']),
      criadoPorId: json['criadoPorId'] as int?,
      criadoPorNome: criadoPor?['nome'] as String?,
      itens: (json['itens'] as List)
          .map((item) => ItemPedido.fromJson(item as Json))
          .toList(),
      total: json['total'] as String,
      mesaNumero: mesa?['numero'] as int?,
      nomeCliente: comanda?['nomeCliente'] as String?,
    );
  }

  final int id;
  final int comandaId;
  final StatusPedido status;
  final String? observacao;
  final DateTime criadoEm;
  final DateTime? iniciadoEm;
  final DateTime? prontoEm;
  final DateTime? entregueEm;
  final int? criadoPorId;
  final String? criadoPorNome;
  final List<ItemPedido> itens;
  final String total;
  final int? mesaNumero;
  final String? nomeCliente;
}

/// Item enviado em POST /pedidos.
class ItemNovoPedido {
  const ItemNovoPedido({
    required this.produtoId,
    required this.quantidade,
    this.observacao,
  });

  final int produtoId;
  final int quantidade;
  final String? observacao;

  Json toJson() {
    final obs = observacao?.trim() ?? '';
    return <String, dynamic>{
      'produtoId': produtoId,
      'quantidade': quantidade,
      if (obs.isNotEmpty) 'observacao': obs,
    };
  }
}

// ---------------------------------------------------------------- Comandas

class ResumoComanda {
  const ResumoComanda({
    required this.quantidadePedidos,
    required this.pedidosPendentesDeEntrega,
    required this.valorEntregue,
    required this.valorEmAndamento,
    required this.valorPrevisto,
    required this.podeFechar,
  });

  factory ResumoComanda.fromJson(Json json) => ResumoComanda(
        quantidadePedidos: json['quantidadePedidos'] as int,
        pedidosPendentesDeEntrega: json['pedidosPendentesDeEntrega'] as int,
        valorEntregue: json['valorEntregue'] as String,
        valorEmAndamento: json['valorEmAndamento'] as String,
        valorPrevisto: json['valorPrevisto'] as String,
        podeFechar: json['podeFechar'] as bool,
      );

  final int quantidadePedidos;
  final int pedidosPendentesDeEntrega;
  final String valorEntregue;
  final String valorEmAndamento;
  final String valorPrevisto;
  final bool podeFechar;
}

class Comanda {
  const Comanda({
    required this.id,
    required this.mesaId,
    required this.mesaNumero,
    required this.status,
    required this.abertaEm,
    required this.pedidos,
    required this.resumo,
    this.nomeCliente,
    this.observacao,
    this.garcomNome,
    this.fechamentoSolicitadoEm,
    this.fechadaEm,
    this.total,
  });

  factory Comanda.fromJson(Json json) {
    final mesa = json['mesa'] as Json;
    final garcom = json['garcom'] as Json?;
    return Comanda(
      id: json['id'] as int,
      mesaId: json['mesaId'] as int,
      mesaNumero: mesa['numero'] as int,
      status: StatusComanda.daApi(json['status'] as String),
      nomeCliente: json['nomeCliente'] as String?,
      observacao: json['observacao'] as String?,
      garcomNome: garcom?['nome'] as String?,
      abertaEm: _data(json['abertaEm']),
      fechamentoSolicitadoEm: _dataOuNula(json['fechamentoSolicitadoEm']),
      fechadaEm: _dataOuNula(json['fechadaEm']),
      total: json['total'] as String?,
      pedidos: (json['pedidos'] as List)
          .map((pedido) => Pedido.fromJson(pedido as Json))
          .toList(),
      resumo: ResumoComanda.fromJson(json['resumo'] as Json),
    );
  }

  final int id;
  final int mesaId;
  final int mesaNumero;
  final StatusComanda status;
  final String? nomeCliente;
  final String? observacao;
  final String? garcomNome;
  final DateTime abertaEm;
  final DateTime? fechamentoSolicitadoEm;
  final DateTime? fechadaEm;

  /// Total gravado pela API no fechamento (null enquanto não fechada).
  final String? total;
  final List<Pedido> pedidos;
  final ResumoComanda resumo;

  bool get aberta => status == StatusComanda.aberta;
}
