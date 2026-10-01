import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

/**
 * Converte erros conhecidos do Prisma em respostas HTTP com o mesmo formato
 * das exceções do Nest ({ statusCode, message, error }), evitando que
 * violações de integridade apareçam como 500.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, message } = this.mapear(exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Erro Prisma não mapeado (${exception.code}): ${exception.message}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status],
      code: exception.code,
    });
  }

  private mapear(e: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (e.code) {
      case 'P2002': {
        const alvo = this.alvo(e);
        if (alvo.includes('comandas_mesa_ativa_key') || alvo === 'mesaId') {
          return {
            status: HttpStatus.CONFLICT,
            message: 'A mesa já possui uma comanda ativa.',
          };
        }
        return {
          status: HttpStatus.CONFLICT,
          message: `Já existe um registro com o mesmo valor${alvo ? ` em: ${alvo}` : ''}.`,
        };
      }
      case 'P2003':
        return {
          status: HttpStatus.CONFLICT,
          message:
            'Operação viola uma relação: o registro referenciado não existe ou está em uso.',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Registro não encontrado.',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro interno ao acessar o banco de dados.',
        };
    }
  }

  private alvo(e: Prisma.PrismaClientKnownRequestError): string {
    const meta = e.meta as Record<string, unknown> | undefined;
    const target =
      meta?.['target'] ??
      (meta?.['driverAdapterError'] as any)?.cause?.constraint?.fields ??
      (meta?.['driverAdapterError'] as any)?.cause?.constraint?.index;
    if (Array.isArray(target)) return target.join(', ');
    return typeof target === 'string' ? target : '';
  }
}
