/**
 * Legacy Supabase Compatibility Shim.
 * Supabase has been removed in favor of the local in-memory 200-student database in `lib/db/localData.ts`.
 * This file remains solely for backwards compatibility with any external scripts.
 */

export function getSupabaseClient(): any {
  return null;
}

export function setTestSupabaseClient(client: any): void {
  // No-op in local mode
}

export function isSupabaseConfigured(): boolean {
  return false;
}

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  projectUrl?: string;
  error?: string;
}> {
  return {
    success: true,
    message: 'Supabase removed: Local 200-student in-memory database is active.',
  };
}
