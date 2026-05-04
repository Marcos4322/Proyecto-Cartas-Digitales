import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurant_id')
  const categoryId = searchParams.get('category_id')
  const excludeAllergens = searchParams.get('exclude_allergens') // "uuid1,uuid2"
  const dietFilter = searchParams.get('diet') // "vegan", "vegetarian", "gluten_free", "pescatarian"
  const onlyAvailable = searchParams.get('only_available')

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

  if (categoryId) query = query.eq('category_id', categoryId)
  if (onlyAvailable === 'true') query = query.eq('is_available', true)
  if (dietFilter === 'vegan') query = query.eq('is_vegan', true)
  if (dietFilter === 'vegetarian') query = query.eq('is_vegetarian', true)
  if (dietFilter === 'gluten_free') query = query.eq('is_gluten_free', true)
  if (dietFilter === 'pescatarian') query = query.eq('is_pescatarian', true)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filtrar por alérgenos a excluir
  let filteredData = data
  if (excludeAllergens) {
    const excludeIds = excludeAllergens.split(',')
    type DishWithAllergens = {
  dish_allergens: { allergens: { id: string } }[]
}

filteredData = data.filter((dish: DishWithAllergens) => {
  const dishAllergenIds = dish.dish_allergens.map(
    (da: { allergens: { id: string } }) => da.allergens.id
  )
      return !excludeIds.some(id => dishAllergenIds.includes(id))
    })
  }

  return NextResponse.json(filteredData)
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    restaurant_id, category_id, name, name_en,
    description, description_en, price, image_url,
    is_available, is_featured, is_vegan, is_vegetarian,
    is_gluten_free, is_pescatarian, position
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
      restaurant_id, category_id, name, name_en,
      description, description_en, price, image_url,
      is_available: is_available ?? true,
      is_featured: is_featured ?? false,
      is_vegan: is_vegan ?? false,
      is_vegetarian: is_vegetarian ?? false,
      is_gluten_free: is_gluten_free ?? false,
      is_pescatarian: is_pescatarian ?? false,
      position: position ?? 0
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id es obligatorio' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('dishes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id es obligatorio' }, { status: 400 })
  }

  const { error } = await supabase.from('dishes').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}