import Link from 'next/link';
import type { ReactNode } from 'react';

export function Cabecalho({
  titulo,
  descricao,
  voltar,
  children,
}: {
  titulo: string;
  descricao?: ReactNode;
  voltar?: { href: string; rotulo: string };
  children?: ReactNode;
}) {
  return (
    <>
      {voltar ? (
        <Link className="voltar" href={voltar.href}>
          ← {voltar.rotulo}
        </Link>
      ) : null}
      <div className="cabecalho">
        <div>
          <h1>{titulo}</h1>
          {descricao ? <p>{descricao}</p> : null}
        </div>
        {children ? <div className="acoes">{children}</div> : null}
      </div>
    </>
  );
}
