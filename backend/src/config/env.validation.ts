/**
 * Valida as variáveis de ambiente na inicialização: a API não sobe com
 * configuração inválida (falha cedo, com mensagem clara).
 */
export interface EnvironmentVariables {
  DATABASE_URL: string;
  PORT: number;
  CORS_ORIGINS: string[];
}

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
  };
}
