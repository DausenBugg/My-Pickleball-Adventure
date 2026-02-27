import type { ConfigContext, ExpoConfig } from 'expo/config';
import fs from 'node:fs';
import path from 'node:path';

type EnvMap = Record<string, string>;

function parseEnvFile(filePath: string): EnvMap {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf-8');
  const output: EnvMap = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    output[key] = value;
  }

  return output;
}

const baseConfig = require('./app.json').expo as ExpoConfig;
const watchEnv = parseEnvFile(path.resolve(__dirname, '.env'));
const mobileEnv = parseEnvFile(path.resolve(__dirname, '../mobile/.env'));

export default ({ config }: ConfigContext): ExpoConfig => {
  const watchSupabaseUrl =
    watchEnv.EXPO_PUBLIC_SUPABASE_URL ??
    mobileEnv.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.EXPO_PUBLIC_SUPABASE_URL;

  const watchSupabaseAnonKey =
    watchEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    mobileEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const resolved = {
    ...baseConfig,
    ...config,
    extra: {
      ...baseConfig.extra,
      ...(config.extra ?? {}),
      watchSupabaseUrl,
      watchSupabaseAnonKey,
    },
  };

  return resolved;
};
