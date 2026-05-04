import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — Obtener categorías de un restaurante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurant_id')

  if (!restaurantId) {
    return NextResponse.json(
      { error: 'restaurant_id es obligatorio' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('position')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST — Crear una categoría nueva
export async function POST(request: Request) {
  const body = await request.json()
  const { restaurant_id, name, name_en, position } = body

  if (!restaurant_id || !name) {
    return NextResponse.json(
      { error: 'restaurant_id y name son obligatorios' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('categories')
    .insert([{ restaurant_id, name, name_en, position }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}