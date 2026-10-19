import { HttpException, HttpStatus } from '@nestjs/common';

const MAX_FALHAS = 5;
const JANELA_MS = 15 * 60 * 1000;

/**
 * Limita tentativas de login erradas por e-mail + IP (proteção contra força
 * bruta), em memória. Suficiente para uma instância única; com várias
 * instâncias, trocar por um armazenamento compartilhado (ex.: Redis).
 */
export class LimitadorLogin {
  private readonly falhas = new Map<string, { qtd: number; inicio: number }>();

  verificar(chave: string): void {
    const registro = this.falhas.get(chave);
    if (!registro) return;
    if (Date.now() - registro.inicio > JANELA_MS) {
      this.falhas.delete(chave);
      return;
    }
    if (registro.qtd >= MAX_FALHAS) {
      const minutos = Math.ceil(
        (JANELA_MS - (Date.now() - registro.inicio)) / 60000,
      );
      throw new HttpException(
        `Muitas tentativas de login. Tente novamente em ${minutos} minuto(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  registrarFalha(chave: string): void {
    const agora = Date.now();
    const registro = this.falhas.get(chave);
    if (!registro || agora - registro.inicio > JANELA_MS) {
      this.falhas.set(chave, { qtd: 1, inicio: agora });
    } else {
      registro.qtd += 1;
    }
    if (this.falhas.size > 10_000) this.limparExpirados(agora);
  }

  limpar(chave: string): void {
    this.falhas.delete(chave);
  }

  private limparExpirados(agora: number) {
    for (const [chave, r] of this.falhas) {
      if (agora - r.inicio > JANELA_MS) this.falhas.delete(chave);
    }
  }
}
