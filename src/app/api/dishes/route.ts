import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type DishWithAllergens = {
  dish_allergens: { allergens: { id: string } }[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurant_id')
  const categoryId = searchParams.get('category_id')
  const excludeAllergens = searchParams.get('exclude_allergens')
  const dietFilter = searchParams.get('diet')
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

  let filteredData = data
  if (excludeAllergens) {
    const excludeIds = excludeAllergens.split(',')
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
    restaurant_id,
    category_id,
    name,
    name_en,
    name_de,
    name_fr,
    description,
    description_en,
    description_de,
    description_fr,
    price,
    image_url,
    is_available,
    is_featured,
    is_vegan,
    is_vegetarian,
    is_gluten_free,
    is_pescatarian,
    is_meat,
    position,
    allergen_ids, // ← array de UUIDs de alérgenos
  } = body

  if (!restaurant_id || !name || !price) {
    return NextResponse.json(
      { error: 'restaurant_id, name y price son obligatorios' },
      { status: 400 }
    )
  }

  // 1. Crear el plato
  const { data: dish, error: dishError } = await supabase
    .from('dishes')
    .insert([{
      restaurant_id,
      category_id,
      name,
      name_en,
      name_de,
      name_fr,
      description,
      description_en,
      description_de,
      description_fr,
      price,
      image_url,
      is_available: is_available ?? true,
      is_featured: is_featured ?? false,
      is_vegan: is_vegan ?? false,
      is_vegetarian: is_vegetarian ?? false,
      is_gluten_free: is_gluten_free ?? false,
      is_pescatarian: is_pescatarian ?? false,
      is_meat: is_meat ?? false,
      position: position ?? 0,
    }])
    .select()
    .single()

  if (dishError) {
    return NextResponse.json({ error: dishError.message }, { status: 500 })
  }

  // 2. Insertar alérgenos si se han seleccionado
  if (allergen_ids && allergen_ids.length > 0) {
    const allergenRows = allergen_ids.map((allergenId: string) => ({
      dish_id: dish.id,
      allergen_id: allergenId,
    }))

    const { error: allergenError } = await supabase
      .from('dish_allergens')
      .insert(allergenRows)

    if (allergenError) {
      return NextResponse.json({ error: allergenError.message }, { status: 500 })
    }
  }

  // 3. Devolver el plato con sus alérgenos
  const { data: dishWithAllergens } = await supabase
    .from('dishes')
    .select(`
      *,
      dish_allergens(
        allergens(id, name, name_en, icon)
      )
    `)
    .eq('id', dish.id)
    .single()

  return NextResponse.json(dishWithAllergens, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const {
    id,
    allergen_ids, // ← array de UUIDs de alérgenos
    ...updates
  } = body

  if (!id) {
    return NextResponse.json(
      { error: 'id es obligatorio' },
      { status: 400 }
    )
  }

  // 1. Actualizar el plato
const { error: dishError } = await supabase
  .from('dishes')
  .update({ ...updates, updated_at: new Date().toISOString() })
  .eq('id', id)

  if (dishError) {
    return NextResponse.json({ error: dishError.message }, { status: 500 })
  }

  // 2. Si se pasan allergen_ids, actualizar los alérgenos
  if (allergen_ids !== undefined) {
    // Borrar todos los alérgenos anteriores del plato
    const { error: deleteError } = await supabase
      .from('dish_allergens')
      .delete()
      .eq('dish_id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Insertar los nuevos alérgenos si hay alguno seleccionado
    if (allergen_ids.length > 0) {
      const allergenRows = allergen_ids.map((allergenId: string) => ({
        dish_id: id,
        allergen_id: allergenId,
      }))

      const { error: insertError } = await supabase
        .from('dish_allergens')
        .insert(allergenRows)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }
  }

  // 3. Devolver el plato con sus alérgenos actualizados
  const { data: dishWithAllergens } = await supabase
    .from('dishes')
    .select(`
      *,
      dish_allergens(
        allergens(id, name, name_en, icon)
      )
    `)
    .eq('id', id)
    .single()

  return NextResponse.json(dishWithAllergens)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'id es obligatorio' },
      { status: 400 }
    )
  }

  // Los dish_allergens se borran solos por el CASCADE de la BD
  const { error } = await supabase
    .from('dishes')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}