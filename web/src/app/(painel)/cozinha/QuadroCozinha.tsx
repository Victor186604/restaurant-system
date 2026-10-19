'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moverPedido } from './acoes';
import { formatarHora, minutosDesde } from '@/lib/formato';
import type { Pedido } from '@/lib/tipos';

const INTERVALO_MS = 10_000;
const ATRASO_MIN = 20;

type Coluna = { chave: 'pendente' | 'preparo' | 'pronto'; titulo: string; pedidos: Pedido[] };

export function QuadroCozinha({
  pendentes,
  emPreparo,
  prontos,
  agora,
}: {
  pendentes: Pedido[];
  emPreparo: Pedido[];
  prontos: Pedido[];
  agora: number;
}) {
  const router = useRouter();
  const [emAndamento, iniciarTransicao] = useTransition();
  const [pedidoAtivo, setPedidoAtivo] = useState<number | null>(null);
  const [erros, setErros] = useState<Record<number, string>>({});

  // Atualiza a fila periodicamente (pedidos novos do garçom aparecem sozinhos).
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [router]);

  function mover(pedido: Pedido, status: 'EM_PREPARO' | 'PRONTO') {
    setPedidoAtivo(pedido.id);
    iniciarTransicao(async () => {
      const resultado = await moverPedido(pedido.id, status);
      setErros((atuais) => {
        const proximos = { ...atuais };
        if (resultado.ok) delete proximos[pedido.id];
        else proximos[pedido.id] = resultado.erro;
        return proximos;
      });
      if (!resultado.ok) router.refresh();
      setPedidoAtivo(null);
    });
  }

  const colunas: Coluna[] = [
    { chave: 'pendente', titulo: 'Pendente', pedidos: pendentes },
    { chave: 'preparo', titulo: 'Em preparo', pedidos: emPreparo },
    { chave: 'pronto', titulo: 'Pronto', pedidos: prontos },
  ];

  return (
    <>
      <p className="atualizacao" aria-live="polite">
        Atualizado às {formatarHora(new Date(agora).toISOString())} · atualiza sozinho a cada 10 segundos
        <button type="button" className="botao secundario pequeno" onClick={() => router.refresh()}>
          Atualizar agora
        </button>
      </p>
      <div className="quadro" style={{ marginTop: '1rem' }}>
        {colunas.map((coluna) => (
          <section key={coluna.chave} className={`coluna ${coluna.chave}`} aria-labelledby={`col-${coluna.chave}`}>
            <header>
              <h2 id={`col-${coluna.chave}`}>{coluna.titulo}</h2>
              <span className="contagem" aria-label={`${coluna.pedidos.length} pedidos`}>
                {coluna.pedidos.length}
              </span>
            </header>
            {coluna.pedidos.length === 0 ? (
              <p className="vazio">
                {coluna.chave === 'pendente'
                  ? 'Nenhum pedido aguardando. Novos pedidos do salão aparecem aqui.'
                  : coluna.chave === 'preparo'
                    ? 'Nada no fogo agora.'
                    : 'Nenhum prato aguardando o garçom.'}
              </p>
            ) : (
              <div className="tickets">
                {coluna.pedidos.map((pedido) => (
                  <Ticket
                    key={pedido.id}
                    pedido={pedido}
                    agora={agora}
                    ocupado={emAndamento && pedidoAtivo === pedido.id}
                    erro={erros[pedido.id]}
                    onMover={mover}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

function Ticket({
  pedido,
  agora,
  ocupado,
  erro,
  onMover,
}: {
  pedido: Pedido;
  agora: number;
  ocupado: boolean;
  erro?: string;
  onMover: (pedido: Pedido, status: 'EM_PREPARO' | 'PRONTO') => void;
}) {
  const referencia = pedido.status === 'EM_PREPARO' ? pedido.iniciadoEm : pedido.status === 'PRONTO' ? pedido.prontoEm : pedido.criadoEm;
  const minutos = minutosDesde(referencia ?? pedido.criadoEm, agora);
  const atrasado = pedido.status !== 'PRONTO' && minutosDesde(pedido.criadoEm, agora) >= ATRASO_MIN;
  const legenda =
    pedido.status === 'PENDENTE' ? 'recebido' : pedido.status === 'EM_PREPARO' ? 'em preparo' : 'pronto';

  return (
    <article className="ticket" aria-label={`Pedido ${pedido.id}, mesa ${pedido.comanda?.mesa.numero ?? '?'}`}>
      <div className="topo">
        <span className="num">#{pedido.id}</span>
        <span className="ticket-mesa">Mesa {pedido.comanda?.mesa.numero ?? '—'}</span>
      </div>
      <p className={`tempo${atrasado ? ' atrasado' : ''}`}>
        {legenda} há {minutos} min{atrasado ? ' · atrasado' : ''}
      </p>
      <ul>
        {pedido.itens.map((item) => (
          <li key={item.id}>
            <span className="qtd">{item.quantidade}×</span>
            <span>{item.produto.nome}</span>
            {item.observacao ? <span className="obs-item">{item.observacao}</span> : null}
          </li>
        ))}
      </ul>
      {pedido.observacao ? <p className="obs-pedido">{pedido.observacao}</p> : null}
      <div className="rodape">
        <span>{pedido.criadoPor?.nome ?? ''}</span>
        {pedido.status === 'PENDENTE' ? (
          <button type="button" className="botao pequeno" disabled={ocupado} onClick={() => onMover(pedido, 'EM_PREPARO')}>
            {ocupado ? 'Enviando…' : 'Iniciar preparo'}
          </button>
        ) : pedido.status === 'EM_PREPARO' ? (
          <button type="button" className="botao sucesso pequeno" disabled={ocupado} onClick={() => onMover(pedido, 'PRONTO')}>
            {ocupado ? 'Enviando…' : 'Marcar pronto'}
          </button>
        ) : (
          <span>Aguardando garçom</span>
        )}
      </div>
      {erro ? (
        <p className="erro" role="alert">
          {erro}
        </p>
      ) : null}
    </article>
  );
}
