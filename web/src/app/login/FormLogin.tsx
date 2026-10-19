'use client';

import { useActionState } from 'react';
import { entrar, type EstadoLogin } from '../acoes-sessao';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { Aviso } from '@/components/Estados';

export function FormLogin({ destino, expirou }: { destino?: string; expirou: boolean }) {
  const [estado, acao] = useActionState<EstadoLogin, FormData>(entrar, {});
  return (
    <form action={acao} className="formulario" noValidate>
      <div>
        <h2 style={{ fontSize: '1.4rem' }}>Entrar</h2>
        <p className="texto-2">Use o e-mail e a senha cadastrados pela gerência.</p>
      </div>
      {expirou && !estado.erro ? <Aviso tipo="erro">Sua sessão expirou. Entre novamente.</Aviso> : null}
      {estado.erro ? <Aviso tipo="erro">{estado.erro}</Aviso> : null}
      <div className="campo">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={estado.email} />
      </div>
      <div className="campo">
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </div>
      {destino ? <input type="hidden" name="next" value={destino} /> : null}
      <BotaoEnviar enviando="Entrando…">Entrar</BotaoEnviar>
    </form>
  );
}
