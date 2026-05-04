import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — Obtener todos los restaurantes
export async function GET() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST — Crear un restaurante nuevo
export async function POST(request: Request) {
  const body = await request.json()
  const { name, slug, description, address, phone, email } = body

  if (!name || !slug) {
    return NextResponse.json(
      { error: 'El nombre y el slug son obligatorios' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('restaurants')
    .insert([{ name, slug, description, address, phone, email }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}