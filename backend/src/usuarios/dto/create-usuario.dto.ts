import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Perfil } from '../../generated/prisma/enums.js';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome: string;

  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  senha: string;

  @IsEnum(Perfil)
  perfil: Perfil;
}
