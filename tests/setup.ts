import { vi } from 'vitest';

// Supabase has been removed in favor of local database in lib/db/localData.ts
vi.mock('../lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => null),
  isSupabaseConfigured: vi.fn(() => false),
  testSupabaseConnection: vi.fn(async () => ({
    success: true,
    message: 'Local database active.',
  })),
}));
