import { IsEnum, IsOptional } from 'class-validator';
import { Perfil } from '../../generated/prisma/enums.js';

export class QueryUsuariosDto {
  @IsOptional()
  @IsEnum(Perfil)
  perfil?: Perfil;
}
