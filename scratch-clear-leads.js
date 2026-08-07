const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

let url = 'https://gkkmamgxdmrzhjalceti.supabase.co';
let key = 'sb_publishable_Vp-HCCvw8U_koxWc9kUcIQ_FCnXlOIB';

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) {
      if (k.trim() === 'NEXT_PUBLIC_SUPABASE_URL') url = v.trim();
      if (k.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') key = v.trim();
    }
  });
} catch (e) {}

const supabase = createClient(url, key);

async function clearAllLeadsAndActivities() {
  console.log('Clearing lead_activities table...');
  const { error: actError } = await supabase.from('lead_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (actError) {
    console.error('Error deleting lead_activities:', actError);
  } else {
    console.log('Successfully cleared lead_activities table in Supabase.');
  }

  console.log('Clearing leads table...');
  const { error: leadsError } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (leadsError) {
    console.error('Error deleting leads:', leadsError);
  } else {
    console.log('Successfully cleared leads table in Supabase.');
  }
}

clearAllLeadsAndActivities();
