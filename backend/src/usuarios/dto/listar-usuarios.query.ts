import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PerfilUsuario } from '../../generated/prisma/enums.js';
import { QueryBoolean } from '../../common/utils/query.transform.js';

export class ListarUsuariosQuery {
  @IsOptional()
  @IsEnum(PerfilUsuario)
  perfil?: PerfilUsuario;

  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  incluirInativos?: boolean;
}
