const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns in users table:');
    if (data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log('No rows in users table, cannot infer schema directly from JS.');
    }
  }
}

checkSchema();
