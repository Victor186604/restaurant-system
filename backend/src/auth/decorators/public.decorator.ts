import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Libera a rota do JWT. Use somente em login e status da API. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
