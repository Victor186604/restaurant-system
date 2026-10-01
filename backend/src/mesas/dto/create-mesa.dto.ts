import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateMesaDto {
  @IsInt()
  @Min(1)
  numero: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  capacidade?: number;
}
