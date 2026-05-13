import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { dish_id, restaurant_id, action } = await request.json()
  // action: 'like' | 'unlike'

  if (!dish_id || !restaurant_id) {
    return NextResponse.json(
      { error: 'dish_id y restaurant_id son obligatorios' },
      { status: 400 }
    )
  }

  const { data: dish } = await supabase
    .from('dishes')
    .select('likes')
    .eq('id', dish_id)
    .single()

  const currentLikes = dish?.likes || 0
  const newLikes = action === 'unlike'
    ? Math.max(0, currentLikes - 1)
    : currentLikes + 1

  const { data: updated, error } = await supabase
    .from('dishes')
    .update({ likes: newLikes })
    .eq('id', dish_id)
    .select('likes')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (action !== 'unlike') {
    await supabase.from('events').insert([{
      restaurant_id,
      event_type: 'dish_like',
      metadata: { dish_id },
    }])
  }

  return NextResponse.json({ likes: updated?.likes || 0 })
}