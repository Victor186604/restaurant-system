'use client';

export default function ErroPainel({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="estado erro" role="alert">
      <h2>Algo deu errado ao montar esta tela</h2>
      <p>Tente novamente. Se o problema continuar, verifique se a API está em execução.</p>
      <button type="button" className="botao secundario pequeno" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
