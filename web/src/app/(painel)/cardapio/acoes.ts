'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { erroDeAcao } from '@/lib/sessao';
import type { DadosProduto } from '@/lib/tipos';

export type EstadoProduto = {
  erro?: string;
  campos?: { nome: string; descricao: string; preco: string; categoriaId: string; disponivel: boolean; ativo: boolean };
};

/** Cria (id null) ou atualiza um produto. Validação definitiva: API. */
export async function salvarProduto(id: number | null, _anterior: EstadoProduto, form: FormData): Promise<EstadoProduto> {
  const campos = {
    nome: String(form.get('nome') ?? '').trim(),
    descricao: String(form.get('descricao') ?? '').trim(),
    preco: String(form.get('preco') ?? '').trim(),
    categoriaId: String(form.get('categoriaId') ?? ''),
    disponivel: form.get('disponivel') === 'on',
    ativo: form.get('ativo') === 'on',
  };

  const preco = Number(campos.preco.replace(/\./g, '').replace(',', '.'));
  const erros: string[] = [];
  if (!campos.nome) erros.push('Informe o nome.');
  if (!campos.preco || !Number.isFinite(preco) || preco < 0) erros.push('Informe um preço válido, por exemplo 32,90.');
  if (!campos.categoriaId) erros.push('Escolha a categoria.');
  if (erros.length) return { erro: erros.join(' '), campos };

  const dados: DadosProduto = {
    nome: campos.nome,
    descricao: campos.descricao || undefined,
    preco: Math.round(preco * 100) / 100,
    categoriaId: Number(campos.categoriaId),
    disponivel: campos.disponivel,
    ...(id !== null ? { ativo: campos.ativo } : {}),
  };

  try {
    if (id === null) await api.produtos.criar(dados);
    else await api.produtos.atualizar(id, dados);
  } catch (erro) {
    const r = erroDeAcao(erro);
    return { erro: r.ok ? undefined : r.erro, campos };
  }
  revalidatePath('/cardapio');
  redirect(`/cardapio?ok=${id === null ? 'criado' : 'atualizado'}`);
}

export type EstadoCategoria = { erro?: string; ok?: string };

export async function criarCategoria(_anterior: EstadoCategoria, form: FormData): Promise<EstadoCategoria> {
  const nome = String(form.get('nome') ?? '').trim();
  if (!nome) return { erro: 'Informe o nome da categoria.' };
  try {
    await api.categorias.criar(nome);
  } catch (erro) {
    const r = erroDeAcao(erro);
    return { erro: r.ok ? undefined : r.erro };
  }
  revalidatePath('/cardapio');
  return { ok: `Categoria “${nome}” criada.` };
}
