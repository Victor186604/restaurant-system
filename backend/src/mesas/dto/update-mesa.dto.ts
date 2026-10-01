import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateMesaDto } from './create-mesa.dto.js';

/**
 * O status (LIVRE/OCUPADA) não é editável aqui: ele é controlado pela
 * abertura e pelo fechamento/cancelamento de comandas.
 */
export class UpdateMesaDto extends PartialType(CreateMesaDto) {
  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}
