import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Prisma } from '../../generated/prisma/client.js';

/**
 * Todos os campos Decimal do modelo são valores monetários com 2 casas.
 * Por padrão o Prisma serializa Decimal("32.90") como "32.9"; este
 * interceptor padroniza a saída como string com 2 casas ("32.90"), sem
 * perda de precisão (não converte para number de ponto flutuante).
 */
@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((dados) => formatarDecimais(dados)));
  }
}

export function formatarDecimais(valor: unknown): unknown {
  if (valor === null || valor === undefined) return valor;
  if (Prisma.Decimal.isDecimal(valor)) {
    return (valor as Prisma.Decimal).toFixed(2);
  }
  if (Array.isArray(valor)) return valor.map(formatarDecimais);
  if (valor instanceof Date) return valor;
  if (typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([k, v]) => [
        k,
        formatarDecimais(v),
      ]),
    );
  }
  return valor;
}
