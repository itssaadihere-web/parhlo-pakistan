require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'parhlo.pakistan.edu@gmail.com',
    password: 'parhlo@2003',
    options: {
      data: {
        full_name: 'Admin',
        role: 'admin'
      }
    }
  });

  if (error) {
    console.error('Sign up error:', error.message);
  } else {
    console.log('Sign up successful:', data);
  }
}

run();
