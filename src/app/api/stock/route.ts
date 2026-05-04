import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH — Cambiar disponibilidad de un plato
export async function PATCH(request: Request) {
  const body = await request.json()
  const { dish_id, is_available } = body

  if (!dish_id || is_available === undefined) {
    return NextResponse.json(
      { error: 'dish_id e is_available son obligatorios' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('dishes')
    .update({ is_available, updated_at: new Date().toISOString() })
    .eq('id', dish_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}