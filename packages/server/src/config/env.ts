import dotenv from 'dotenv';
import path from 'path';

const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(__dirname, '../../../../.env'),
];

candidates.forEach((file) => dotenv.config({ path: file }));

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. See .env.example.`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

// Comma-separated list so a production deployment can name every trusted frontend origin.
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (nodeEnv === 'production' && corsOrigins.length === 0) {
  throw new Error(
    'CORS_ORIGIN must list one or more trusted origins when NODE_ENV=production. See .env.example.',
  );
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv,
  corsOrigin: corsOrigins[0] || 'http://localhost:5173',
  corsOrigins,
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  testDatabaseUrl: process.env.TEST_DATABASE_URL || '',
};

export const isProduction = env.nodeEnv === 'production';
