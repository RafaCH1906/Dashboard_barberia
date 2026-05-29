import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  // Initialise Supabase client lazily to avoid build‑time env requirements
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  try {
    const { phone, message, barber_shop_id } = await req.json();
    if (!phone || !message || !barber_shop_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('message_queue')
      .insert({ phone, message, barber_shop_id, status: 'pending' });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('send‑message API error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
