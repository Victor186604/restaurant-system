// Tipos das respostas da API NestJS (ver docs/contrato-api.md e docs/backend-api.md).
// Valores monetários chegam como string com 2 casas ("64.90").

export type Perfil = 'ADMIN' | 'GERENTE' | 'GARCOM' | 'COZINHA';
export type StatusMesa = 'LIVRE' | 'OCUPADA';
export type StatusComanda = 'ABERTA' | 'FECHAMENTO_SOLICITADO' | 'FECHADA' | 'CANCELADA';
export type StatusPedido = 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';

/** Situação exibida no salão (derivada de mesa.status + comandaAtiva.status). */
export type SituacaoMesa = 'LIVRE' | 'OCUPADA' | 'AGUARDANDO_FECHAMENTO';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface UsuarioResumo {
  id: number;
  nome: string;
  perfil: Perfil;
}

export interface RespostaLogin {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  usuario: Usuario;
}

export interface Mesa {
  id: number;
  numero: number;
  capacidade: number;
  status: StatusMesa;
  ativa: boolean;
  comandaAtiva: {
    id: number;
    status: StatusComanda;
    abertaEm: string;
    nomeCliente: string | null;
  } | null;
}

export interface Categoria {
  id: number;
  nome: string;
  ordem: number;
  ativa: boolean;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  preco: string;
  categoriaId: number;
  disponivel: boolean;
  ativo: boolean;
  categoria: { id: number; nome: string };
}

export interface ItemPedido {
  id: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: string;
  observacao: string | null;
  produto: { id: number; nome: string };
  subtotal: string;
}

export interface Pedido {
  id: number;
  comandaId: number;
  status: StatusPedido;
  observacao: string | null;
  criadoEm: string;
  iniciadoEm: string | null;
  prontoEm: string | null;
  entregueEm: string | null;
  canceladoEm: string | null;
  itens: ItemPedido[];
  criadoPor: UsuarioResumo | null;
  total: string;
  comanda?: {
    id: number;
    status: StatusComanda;
    nomeCliente: string | null;
    mesa: { id: number; numero: number };
  };
}

interface ComandaBase {
  id: number;
  mesaId: number;
  garcomId: number | null;
  status: StatusComanda;
  nomeCliente: string | null;
  observacao: string | null;
  total: string | null;
  abertaEm: string;
  fechamentoSolicitadoEm: string | null;
  fechadaEm: string | null;
  canceladaEm: string | null;
  garcom: UsuarioResumo | null;
}

export interface ComandaResumo extends ComandaBase {
  mesa: { id: number; numero: number };
  _count: { pedidos: number };
}

export interface ResumoComanda {
  quantidadePedidos: number;
  pedidosPendentesDeEntrega: number;
  valorEntregue: string;
  valorEmAndamento: string;
  valorPrevisto: string;
  podeFechar: boolean;
}

export interface ComandaDetalhe extends ComandaBase {
  mesa: { id: number; numero: number; status: StatusMesa };
  pedidos: Pedido[];
  resumo: ResumoComanda;
}

export interface DadosProduto {
  nome: string;
  descricao?: string;
  preco: number;
  categoriaId: number;
  disponivel: boolean;
  ativo?: boolean;
}
