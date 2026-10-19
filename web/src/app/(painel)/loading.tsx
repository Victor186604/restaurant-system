import { Esqueleto } from '@/components/Estados';

export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <Esqueleto altura={40} />
      <div style={{ height: 24 }} />
      <Esqueleto altura={320} />
    </div>
  );
}
