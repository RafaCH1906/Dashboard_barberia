import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BARBER_SHOP_ID = process.env.NEXT_PUBLIC_BARBER_SHOP_ID || 'a1b2c3d4-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase
    .from('barber_shops')
    .select('*')
    .eq('id', BARBER_SHOP_ID)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
