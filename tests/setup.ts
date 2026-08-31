import { vi } from 'vitest';
import { createMockSupabaseClient } from './mockSupabase';

const mockClient = createMockSupabaseClient();

vi.mock('../lib/supabase', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getSupabaseClient: vi.fn(() => mockClient),
    isSupabaseConfigured: vi.fn(() => true),
  };
});
