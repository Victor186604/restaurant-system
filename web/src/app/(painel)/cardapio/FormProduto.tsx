'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { salvarProduto, type EstadoProduto } from './acoes';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { Aviso } from '@/components/Estados';
import type { Categoria, Produto } from '@/lib/tipos';

/** Formulário único para cadastrar e editar produtos. */
export function FormProduto({ produto, categorias }: { produto?: Produto; categorias: Categoria[] }) {
  const [estado, acao] = useActionState<EstadoProduto, FormData>(salvarProduto.bind(null, produto?.id ?? null), {});
  const v = estado.campos ?? {
    nome: produto?.nome ?? '',
    descricao: produto?.descricao ?? '',
    preco: produto ? produto.preco.replace('.', ',') : '',
    categoriaId: produto ? String(produto.categoriaId) : '',
    disponivel: produto?.disponivel ?? true,
    ativo: produto?.ativo ?? true,
  };
  const categoriasAtivas = categorias.filter((c) => c.ativa || c.id === produto?.categoriaId);

  return (
    // key: remonta os campos com os valores devolvidos após um erro
    <form action={acao} className="formulario" key={JSON.stringify(estado.campos ?? {})}>
      {estado.erro ? <Aviso tipo="erro">{estado.erro}</Aviso> : null}
      <div className="campo">
        <label htmlFor="nome">Nome</label>
        <input id="nome" name="nome" required maxLength={120} defaultValue={v.nome} />
      </div>
      <div className="campo">
        <label htmlFor="descricao">Descrição</label>
        <textarea id="descricao" name="descricao" maxLength={500} defaultValue={v.descricao} />
      </div>
      <div className="campo">
        <label htmlFor="preco">Preço (R$)</label>
        <input id="preco" name="preco" inputMode="decimal" required placeholder="32,90" defaultValue={v.preco} />
      </div>
      <div className="campo">
        <label htmlFor="categoriaId">Categoria</label>
        <select id="categoriaId" name="categoriaId" required defaultValue={v.categoriaId}>
          <option value="" disabled>
            Escolha…
          </option>
          {categoriasAtivas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      <label className="marcar">
        <input type="checkbox" name="disponivel" defaultChecked={v.disponivel} />
        Disponível hoje
      </label>
      {produto ? (
        <label className="marcar">
          <input type="checkbox" name="ativo" defaultChecked={v.ativo} />
          Ativo no cardápio (desmarque para remover)
        </label>
      ) : null}
      <div className="acoes">
        <BotaoEnviar enviando="Salvando…">{produto ? 'Salvar alterações' : 'Cadastrar produto'}</BotaoEnviar>
        <Link className="botao secundario" href="/cardapio">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
