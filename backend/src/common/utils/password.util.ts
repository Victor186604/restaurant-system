import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  senha: string,
  salt: Buffer,
  tamanho: number,
) => Promise<Buffer>;

const TAMANHO_CHAVE = 64;

/**
 * Hash de senha com scrypt (módulo nativo node:crypto, sem dependências).
 * Formato armazenado: scrypt$<salt hex>$<hash hex>.
 * Será reaproveitado pela autenticação JWT na próxima etapa.
 */
export async function gerarHashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(senha, salt, TAMANHO_CHAVE);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verificarSenha(
  senha: string,
  armazenado: string,
): Promise<boolean> {
  const [algoritmo, saltHex, hashHex] = armazenado.split('$');
  if (algoritmo !== 'scrypt' || !saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = await scryptAsync(
    senha,
    Buffer.from(saltHex, 'hex'),
    esperado.length,
  );
  return timingSafeEqual(esperado, calculado);
}
