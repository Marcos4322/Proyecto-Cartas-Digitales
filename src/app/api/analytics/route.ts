import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.json()
  const { restaurant_id, event_type, metadata, session_id } = body

  if (!restaurant_id || !event_type) {
    return NextResponse.json(
      { error: 'restaurant_id y event_type son obligatorios' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('events')
    .insert([{ restaurant_id, event_type, metadata, session_id }])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurant_id')
  const days = parseInt(searchParams.get('days') || '30')

  if (!restaurantId) {
    return NextResponse.json(
      { error: 'restaurant_id es obligatorio' },
      { status: 400 }
    )
  }

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceISO = since.toISOString()

  // 1. Total escaneos QR
  const { count: totalScans } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('event_type', 'qr_scan')
    .gte('created_at', sinceISO)

  // 2. Total vistas de platos
  const { count: totalDishViews } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('event_type', 'dish_view')
    .gte('created_at', sinceISO)

  // 3. Total filtros usados
  const { count: totalFilters } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('event_type', 'filter_used')
    .gte('created_at', sinceISO)

  // 4. Total cambios de idioma
  const { count: totalLangChanges } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('event_type', 'language_change')
    .gte('created_at', sinceISO)

  // 5. Total likes
  const { count: totalLikes } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('event_type', 'dish_like')
    .gte('created_at', sinceISO)

  // 6. Platos mas vistos
  const { data: dishViewsRaw } = await supabase
    .from('events')
    .select('metadata')
    .eq('restaurant_id', restaurantId)
    .eq('event_type', 'dish_view')
    .gte('created_at', sinceISO)

  const dishCounts: Record<string, number> = {}
  dishViewsRaw?.forEach(e => {
    const name = e.metadata?.dish_name
    if (name) dishCounts[name] = (dishCounts[name] || 0) + 1
  })
  const topDishes = Object.entries(dishCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // 7. Filtros mas usados
  const { data: filtersRaw } = await supabase
    .from('events')
    .select('metadata')
    .eq('restaurant_id', restaurantId)
    .eq('event_type', 'filter_used')
    .gte('created_at', sinceISO)

  const filterCounts: Record<string, number> = {}
  filtersRaw?.forEach(e => {
    const name = e.metadata?.filter_name
    if (name) filterCounts[name] = (filterCounts[name] || 0) + 1
  })
  const topFilters = Object.entries(filterCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  // 8. Idiomas mas usados
  const { data: langsRaw } = await supabase
    .from('events')
    .select('metadata')
    .eq('restaurant_id', restaurantId)
    .eq('event_type', 'language_change')
    .gte('created_at', sinceISO)

  const langCounts: Record<string, number> = {}
  langsRaw?.forEach(e => {
    const lang = e.metadata?.lang
    if (lang) langCounts[lang] = (langCounts[lang] || 0) + 1
  })
  const topLangs = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => ({ lang, count }))

  // 9. Escaneos por dia (ultimos 7 dias)
  const { data: scansByDayRaw } = await supabase
    .from('events')
    .select('created_at')
    .eq('restaurant_id', restaurantId)
    .eq('event_type', 'qr_scan')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const scansByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    scansByDay[key] = 0
  }
  scansByDayRaw?.forEach(e => {
    const day = e.created_at.split('T')[0]
    if (scansByDay[day] !== undefined) scansByDay[day]++
  })
  const scansPerDay = Object.entries(scansByDay)
    .map(([date, count]) => ({ date, count }))

  // 10. Likes por plato
  const { data: dishLikes } = await supabase
    .from('dishes')
    .select('name, likes')
    .eq('restaurant_id', restaurantId)
    .gt('likes', 0)
    .order('likes', { ascending: false })

  return NextResponse.json({
    period_days: days,
    totals: {
      qr_scans: totalScans || 0,
      dish_views: totalDishViews || 0,
      filters_used: totalFilters || 0,
      lang_changes: totalLangChanges || 0,
      likes: totalLikes || 0,
    },
    top_dishes: topDishes,
    top_filters: topFilters,
    top_langs: topLangs,
    scans_per_day: scansPerDay,
    dish_likes: dishLikes || [],
  })
}