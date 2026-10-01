import { PartialType } from '@nestjs/mapped-types';
import { CreateMesaDto } from './create-mesa.dto.js';

/** O status da mesa não é editável: ele é controlado pela abertura/fechamento de comandas. */
export class UpdateMesaDto extends PartialType(CreateMesaDto) {}
