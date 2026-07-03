require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('*').eq('email', 'farazsohail18@gmail.com');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkUsers();
