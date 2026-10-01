import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';
import { Prisma } from '../../generated/prisma/client.js';

/**
 * Serializa valores monetários (Prisma.Decimal) como string com duas casas
 * decimais — ex.: "64.90" — preservando a precisão sem arredondamentos de float.
 */
@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map(serializarDecimais));
  }
}

function serializarDecimais(valor: unknown): unknown {
  if (Prisma.Decimal.isDecimal(valor)) {
    return valor.toFixed(2);
  }
  if (Array.isArray(valor)) {
    return valor.map(serializarDecimais);
  }
  if (valor !== null && Object.getPrototypeOf(valor) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([chave, v]) => [
        chave,
        serializarDecimais(v),
      ]),
    );
  }
  return valor;
}
