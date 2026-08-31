import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load .env.local / .env into process.env if running in CLI or standalone script mode.
 */
function loadLocalEnv() {
  const rootDirs = [process.cwd(), path.resolve(__dirname, '..'), __dirname];
  const envFiles = ['.env.local', '.env'];
  for (const rootDir of rootDirs) {
    for (const file of envFiles) {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
              const key = trimmed.slice(0, eqIdx).trim();
              const val = trimmed.slice(eqIdx + 1).trim();
              if (key && val && !process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        } catch {
          // Ignore file read error
        }
      }
    }
  }
}

// Auto-load on initialization
loadLocalEnv();

/**
 * Server-side Singleton Supabase Client Factory.
 * The Service Role Key or Anon Key is loaded strictly on the server.
 * Never exposed to browser bundles or client-side JavaScript.
 */
let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  loadLocalEnv();
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_PROJECT_URL;

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClientInstance;
}

export function setTestSupabaseClient(client: any): void {
  supabaseClientInstance = client;
}

export function isSupabaseConfigured(): boolean {
  loadLocalEnv();
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_PROJECT_URL;

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return !!(supabaseUrl && supabaseKey);
}

/**
 * Safe connection test against Supabase.
 * Returns a standardized status without exposing credentials.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  projectUrl?: string;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'SUPABASE CONNECTION: FAILED — Missing environment variables (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY).',
      error: 'ENV_VARIABLES_MISSING',
    };
  }

  try {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_PROJECT_URL ||
      '';
    const parsedUrl = new URL(supabaseUrl);
    const projectHost = parsedUrl.host;

    // Test a basic query against departments table
    const { data, error } = await client.from('departments').select('id, code, name').limit(1);

    if (error) {
      // If table does not exist yet (42P01 / PGRST205), connection to Supabase is authenticated and successful
      if (error.code === '42P01' || error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return {
          success: true,
          message: 'SUPABASE CONNECTION: SUCCESS (Database authenticated; schema tables pending creation).',
          projectUrl: projectHost,
        };
      }
      return {
        success: false,
        message: `SUPABASE CONNECTION: FAILED — ${error.message}`,
        projectUrl: projectHost,
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'SUPABASE CONNECTION: SUCCESS',
      projectUrl: projectHost,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `SUPABASE CONNECTION: FAILED — ${err.message || 'Unknown network/connection error.'}`,
      error: err.message,
    };
  }
}
