import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

/**
 * Converte erros conhecidos do Prisma em respostas HTTP adequadas,
 * evitando que violações de restrições do banco cheguem ao cliente como 500.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const mapped = this.map(exception);
    if (!mapped) {
      return super.catch(exception, host);
    }

    const response = host.switchToHttp().getResponse<Response>();
    response.status(mapped.statusCode).json(mapped);
  }

  private map(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002': {
        const campos = this.campos(exception);
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: campos
            ? `Já existe um registro com o mesmo valor para: ${campos}`
            : 'Já existe um registro com os mesmos valores únicos',
        };
      }
      case 'P2003':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message:
            'Operação viola uma referência entre registros (chave estrangeira)',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Registro não encontrado',
        };
      default:
        return null;
    }
  }

  /**
   * Identifica os campos da restrição violada. Com o @prisma/adapter-pg o Prisma
   * informa o nome do índice (ex.: "mesas_numero_key") em vez da lista de campos.
   */
  private campos(exception: Prisma.PrismaClientKnownRequestError) {
    const meta = exception.meta as
      | {
          target?: string[] | string;
          driverAdapterError?: {
            cause?: {
              table?: string;
              constraint?: { fields?: string[]; index?: string };
            };
          };
        }
      | undefined;
    const cause = meta?.driverAdapterError?.cause;
    const fields = cause?.constraint?.fields ?? meta?.target;
    if (fields) {
      return Array.isArray(fields) ? fields.join(', ') : fields;
    }
    const index = cause?.constraint?.index;
    if (index && cause?.table) {
      return index.replace(`${cause.table}_`, '').replace(/_key$/, '');
    }
    return null;
  }
}
