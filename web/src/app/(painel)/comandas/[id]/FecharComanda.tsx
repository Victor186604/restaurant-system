'use client';

import { useActionState } from 'react';
import { fecharComanda } from '../acoes';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { Aviso } from '@/components/Estados';
import type { ResultadoAcao } from '@/lib/sessao';

export function FecharComanda({ id, total }: { id: number; total: string }) {
  const [resultado, acao] = useActionState<ResultadoAcao | null, FormData>(fecharComanda.bind(null, id), null);
  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        if (!window.confirm(`Fechar a comanda #${id} no valor de ${total}?`)) evento.preventDefault();
      }}
    >
      {resultado && !resultado.ok ? <Aviso tipo="erro">{resultado.erro}</Aviso> : null}
      <BotaoEnviar enviando="Fechando…" className="botao sucesso">
        Fechar comanda
      </BotaoEnviar>
    </form>
  );
}
