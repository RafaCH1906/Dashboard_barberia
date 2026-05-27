import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const BARBER_SHOP_ID = process.env.NEXT_PUBLIC_BARBER_SHOP_ID || 'a1b2c3d4-0000-0000-0000-000000000001'
