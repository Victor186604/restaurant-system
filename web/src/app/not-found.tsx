import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <main className="conteudo">
      <div className="estado">
        <h2>Página não encontrada</h2>
        <p>O endereço não existe ou o registro foi removido.</p>
        <Link className="botao secundario pequeno" href="/">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
