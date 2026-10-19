'use client';

import { useFormStatus } from 'react-dom';

/** Botão de formulário que se desabilita enquanto a Server Action executa. */
export function BotaoEnviar({
  children,
  enviando,
  className = 'botao',
}: {
  children: string;
  enviando: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? enviando : children}
    </button>
  );
}
