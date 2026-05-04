import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import MenuClient from './MenuClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getRestaurantData(slug: string) {
  // Obtener restaurante
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (restError || !restaurant) return null

  // Obtener categorías
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .order('position')

  // Obtener platos con alérgenos
  const { data: dishes } = await supabase
    .from('dishes')
    .select(`
      *,
      dish_allergens(
        allergens(id, name, name_en, icon)
      )
    `)
    .eq('restaurant_id', restaurant.id)
    .order('position')

  return { restaurant, categories: categories || [], dishes: dishes || [] }
}

export default async function MenuPage({
  params,
}: {
  params: { slug: string }
}) {
  const data = await getRestaurantData(params.slug)

  if (!data) notFound()

  return <MenuClient data={data} />
}