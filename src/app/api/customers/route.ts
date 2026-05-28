import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BARBER_SHOP_ID = process.env.NEXT_PUBLIC_BARBER_SHOP_ID || 'a1b2c3d4-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('barber_shop_id', BARBER_SHOP_ID)
    .order('loyalty_points', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  try {
    const { id, loyalty_points } = await request.json()

    if (id === undefined || loyalty_points === undefined) {
      return NextResponse.json({ error: 'Missing id or loyalty_points' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from('customers')
      .update({ loyalty_points })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
