import { IsBoolean, IsOptional } from 'class-validator';
import { QueryBoolean } from '../../common/utils/query.transform.js';

export class ListarCategoriasQuery {
  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  incluirInativas?: boolean;
}
