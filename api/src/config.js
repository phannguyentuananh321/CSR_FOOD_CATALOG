import 'dotenv/config';
import { fileURLToPath } from 'node:url';

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  appBaseUrl: (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  webOrigins: (process.env.WEB_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  databaseUrl: process.env.DATABASE_URL || '',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'dish-images',
  },
  uploadDir: fileURLToPath(new URL('../uploads/', import.meta.url)),
  maxImageSizeBytes: 5 * 1024 * 1024,
};

export const isSupabaseConfigured = Boolean(
  config.supabase.url && config.supabase.serviceRoleKey
);
