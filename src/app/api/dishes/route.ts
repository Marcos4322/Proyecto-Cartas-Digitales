import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — Obtener platos de un restaurante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurant_id')
  const categoryId = searchParams.get('category_id')

  if (!restaurantId) {
    return NextResponse.json(
      { error: 'restaurant_id es obligatorio' },
      { status: 400 }
    )
  }

  let query = supabase
    .from('dishes')
    .select(`
      *,
      categories(id, name, name_en),
      dish_allergens(
        allergens(id, name, name_en, icon)
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('position')

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST — Crear un plato nuevo
export async function POST(request: Request) {
  const body = await request.json()
  const {
    restaurant_id,
    category_id,
    name,
    name_en,
    description,
    description_en,
    price,
    image_url,
    is_available,
    is_featured,
    position
  } = body

  if (!restaurant_id || !name || !price) {
    return NextResponse.json(
      { error: 'restaurant_id, name y price son obligatorios' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('dishes')
    .insert([{
      restaurant_id,
      category_id,
      name,
      name_en,
      description,
      description_en,
      price,
      image_url,
      is_available: is_available ?? true,
      is_featured: is_featured ?? false,
      position: position ?? 0
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}