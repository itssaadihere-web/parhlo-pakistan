import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gkkmamgxdmrzhjalceti.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Vp-HCCvw8U_koxWc9kUcIQ_FCnXlOIB'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
