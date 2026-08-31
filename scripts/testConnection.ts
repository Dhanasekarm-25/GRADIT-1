import { testSupabaseConnection, isSupabaseConfigured } from '../lib/supabase';

async function main() {
  console.log('====================================================');
  console.log('GRADit! ERP — Supabase Connection Status Test');
  console.log('====================================================\n');

  if (!isSupabaseConfigured()) {
    console.log('STATUS: STANDBY');
    console.log('Missing Environment Variables:');
    console.log('  - SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
    console.log('\nPlease add these variables to your .env.local file to connect to live Supabase.');
    console.log('====================================================');
    return;
  }

  const result = await testSupabaseConnection();

  if (result.success) {
    console.log('SUPABASE CONNECTION: SUCCESS');
    if (result.projectUrl) {
      console.log(`Target Project Host: ${result.projectUrl}`);
    }
  } else {
    console.log('SUPABASE CONNECTION: FAILED');
    console.log(`Error: ${result.message}`);
  }
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Connection test error:', err.message);
});
