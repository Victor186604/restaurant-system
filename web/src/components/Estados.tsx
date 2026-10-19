import Link from 'next/link';
import type { ReactNode } from 'react';

export function EstadoVazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="estado">
      <h2>{titulo}</h2>
      {children}
    </div>
  );
}

/** Erro vindo da API, com a mensagem dela e o que fazer. */
export function EstadoErro({ mensagem, status }: { mensagem: string; status?: number }) {
  const titulo =
    status === 403
      ? 'Seu perfil não tem acesso a esta informação'
      : status === 404
        ? 'Registro não encontrado'
        : 'Não foi possível carregar os dados';
  return (
    <div className="estado erro" role="alert">
      <h2>{titulo}</h2>
      <p>{mensagem}</p>
      {status === 503 || status === undefined ? (
        <Link className="botao secundario pequeno" href="?">
          Tentar novamente
        </Link>
      ) : null}
    </div>
  );
}

export function Aviso({ tipo, children }: { tipo: 'sucesso' | 'erro'; children: ReactNode }) {
  return (
    <div className={`aviso ${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Esqueleto({ altura = 120 }: { altura?: number }) {
  return <div className="esqueleto" style={{ height: altura }} aria-hidden="true" />;
}
