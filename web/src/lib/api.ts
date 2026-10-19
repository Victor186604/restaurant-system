import { cookies } from 'next/headers';
import { COOKIE_SESSAO } from './constantes';
import type {
  Categoria,
  ComandaDetalhe,
  ComandaResumo,
  DadosProduto,
  Mesa,
  Pedido,
  Produto,
  RespostaLogin,
  StatusComanda,
  StatusPedido,
  Usuario,
} from './tipos';

/**
 * Serviço HTTP central: toda comunicação com a API NestJS passa por aqui.
 * Roda apenas no servidor do Next.js (usa next/headers): o JWT fica em cookie
 * httpOnly e nunca é exposto ao JavaScript do navegador.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Opcoes {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  /** false somente no login. */
  autenticar?: boolean;
}

function urlBase(): string {
  const url = process.env.API_URL;
  if (!url) {
    throw new ApiError(500, 'API_URL não configurada. Copie web/..env para web/..env.');
  }
  return url.replace(/\/+$/, '');
}

function mensagemDeErro(dados: unknown, status: number): string {
  if (dados && typeof dados === 'object' && 'message' in dados) {
    const msg = (dados as { message: unknown }).message;
    if (Array.isArray(msg)) return msg.join(' ');
    if (typeof msg === 'string') return msg;
  }
  return `A API respondeu com erro ${status}.`;
}

export async function apiFetch<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { method = 'GET', body, autenticar = true } = opcoes;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (autenticar) {
    const token = (await cookies()).get(COOKIE_SESSAO)?.value;
    if (!token) throw new ApiError(401, 'Sessão expirada. Entre novamente.');
    headers.Authorization = `Bearer ${token}`;
  }

  let resposta: Response;
  try {
    resposta = await fetch(`${urlBase()}${caminho}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(503, 'Não foi possível conectar à API. Verifique se o backend está em execução.');
  }

  const texto = await resposta.text();
  let dados: unknown = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }
  if (!resposta.ok) throw new ApiError(resposta.status, mensagemDeErro(dados, resposta.status));
  return dados as T;
}

function query(params: Record<string, string | number | boolean | string[] | undefined>): string {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined) continue;
    busca.set(chave, Array.isArray(valor) ? valor.join(',') : String(valor));
  }
  const texto = busca.toString();
  return texto ? `?${texto}` : '';
}

/** Endpoints usados pelo cliente web (docs/contrato-api.md). */
export const api = {
  auth: {
    login: (email: string, senha: string) =>
      apiFetch<RespostaLogin>('/auth/login', { method: 'POST', body: { email, senha }, autenticar: false }),
    me: () => apiFetch<Usuario>('/auth/me'),
  },
  mesas: {
    listar: () => apiFetch<Mesa[]>('/mesas'),
    buscar: (id: number) => apiFetch<Mesa>(`/mesas/${id}`),
  },
  comandas: {
    listar: (status?: StatusComanda[]) =>
      apiFetch<ComandaResumo[]>(`/comandas${query({ status })}`),
    buscar: (id: number) => apiFetch<ComandaDetalhe>(`/comandas/${id}`),
    fechar: (id: number) => apiFetch<ComandaDetalhe>(`/comandas/${id}/fechar`, { method: 'POST' }),
  },
  pedidos: {
    cozinha: () => apiFetch<Pedido[]>('/pedidos/cozinha'),
    listar: (status?: StatusPedido[]) => apiFetch<Pedido[]>(`/pedidos${query({ status })}`),
    alterarStatus: (id: number, status: StatusPedido) =>
      apiFetch<Pedido>(`/pedidos/${id}/status`, { method: 'PATCH', body: { status } }),
  },
  categorias: {
    listar: () => apiFetch<Categoria[]>('/categorias?incluirInativas=true'),
    criar: (nome: string) => apiFetch<Categoria>('/categorias', { method: 'POST', body: { nome } }),
  },
  produtos: {
    listar: () => apiFetch<Produto[]>('/produtos?incluirInativos=true'),
    buscar: (id: number) => apiFetch<Produto>(`/produtos/${id}`),
    criar: (dados: DadosProduto) => apiFetch<Produto>('/produtos', { method: 'POST', body: dados }),
    atualizar: (id: number, dados: DadosProduto) =>
      apiFetch<Produto>(`/produtos/${id}`, { method: 'PATCH', body: dados }),
  },
};
