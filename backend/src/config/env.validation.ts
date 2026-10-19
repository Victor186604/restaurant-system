/**
 * Valida as variáveis de ambiente na inicialização: a API não sobe com
 * configuração inválida (falha cedo, com mensagem clara).
 */
export interface EnvironmentVariables {
  DATABASE_URL: string;
  PORT: number;
  CORS_ORIGINS: string[];
  JWT_SECRET: string;
  /** Validade do token, em segundos. */
  JWT_EXPIRES_IN: number;
}

const COMANDO_SEGREDO =
  "node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"";

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const erros: string[] = [];

  const databaseUrl = config['DATABASE_URL'];
  if (typeof databaseUrl !== 'string' || databaseUrl.trim() === '') {
    erros.push('DATABASE_URL é obrigatória.');
  } else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    erros.push(
      'DATABASE_URL deve começar com postgresql:// (verifique se não há aspas ou o nome da variável duplicados).',
    );
  }

  const port = Number(config['PORT'] ?? 3000);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    erros.push('PORT deve ser um número inteiro entre 1 e 65535.');
  }

  const jwtSecret = config['JWT_SECRET'];
  if (typeof jwtSecret !== 'string' || jwtSecret.length < 32) {
    erros.push(
      `JWT_SECRET é obrigatório e deve ter pelo menos 32 caracteres. Gere um com: ${COMANDO_SEGREDO}`,
    );
  }

  const jwtExpiresIn = Number(config['JWT_EXPIRES_IN'] ?? 28800);
  if (!Number.isInteger(jwtExpiresIn) || jwtExpiresIn < 60) {
    erros.push(
      'JWT_EXPIRES_IN deve ser um número inteiro de segundos (>= 60).',
    );
  }

  if (erros.length > 0) {
    throw new Error(
      `Configuração inválida no .env:\n - ${erros.join('\n - ')}`,
    );
  }

  const corsOrigins = String(config['CORS_ORIGINS'] ?? '')
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean);

  return {
    DATABASE_URL: databaseUrl as string,
    PORT: port,
    CORS_ORIGINS: corsOrigins,
    JWT_SECRET: jwtSecret as string,
    JWT_EXPIRES_IN: jwtExpiresIn,
  };
}
