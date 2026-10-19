import type { Metadata } from 'next';
import { FormLogin } from './FormLogin';
import { destinoSeguro } from '@/lib/sessao';

export const metadata: Metadata = { title: 'Entrar' };

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expirou?: string }>;
}) {
  const { next, expirou } = await searchParams;
  return (
    <main className="login">
      <section className="lado">
        <h1>Cozinha e gerência do restaurante</h1>
        <p>Acompanhe a fila de preparo, o salão, as comandas e o cardápio em tempo real.</p>
      </section>
      <section className="form">
        <FormLogin destino={destinoSeguro(next) ?? undefined} expirou={expirou === '1'} />
      </section>
    </main>
  );
}
