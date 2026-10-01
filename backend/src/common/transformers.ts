import type { TransformFnParams } from 'class-transformer';

/** Converte os valores de query string "true"/"false" em boolean. */
export function toBoolean({ value }: TransformFnParams): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}
