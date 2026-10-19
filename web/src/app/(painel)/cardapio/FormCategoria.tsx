'use client';

import { useActionState } from 'react';
import { criarCategoria, type EstadoCategoria } from './acoes';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { Aviso } from '@/components/Estados';

export function FormCategoria() {
  const [estado, acao] = useActionState<EstadoCategoria, FormData>(criarCategoria, {});
  return (
    <form action={acao} className="formulario" key={estado.ok ?? 'form'}>
      {estado.erro ? <Aviso tipo="erro">{estado.erro}</Aviso> : null}
      {estado.ok ? <Aviso tipo="sucesso">{estado.ok}</Aviso> : null}
      <div className="campo">
        <label htmlFor="nome-categoria">Nova categoria</label>
        <input id="nome-categoria" name="nome" maxLength={80} required placeholder="Ex.: Massas" />
      </div>
      <BotaoEnviar enviando="Criando…" className="botao secundario">
        Criar categoria
      </BotaoEnviar>
    </form>
  );
}
