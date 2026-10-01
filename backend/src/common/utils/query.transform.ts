import { Transform } from 'class-transformer';

/**
 * Query string booleana: aceita "true"/"false"/"1"/"0".
 * (enableImplicitConversion transformaria "false" em true.)
 */
export function QueryBoolean() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    const v = String(value).toLowerCase();
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
    return value; // deixa o @IsBoolean rejeitar
  });
}

/**
 * Query string com múltiplos valores: aceita ?status=A&status=B ou ?status=A,B.
 */
export function QueryArray() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const lista = Array.isArray(value) ? value : [value];
    return lista
      .flatMap((v) => String(v).split(','))
      .map((v) => v.trim())
      .filter(Boolean);
  });
}
