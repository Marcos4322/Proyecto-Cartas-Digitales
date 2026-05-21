import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener el ID del restaurante demo
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('slug', 'la-taberna-del-puerto')
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante no encontrado' })
    }

    // Intentar insertar una reserva de prueba
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        restaurant_id: restaurant.id,
        customer_name: 'Test desde API',
        party_size: 2,
        reservation_date: '2026-06-20',
        reservation_time: '21:00',
        source: 'test',
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        details: error,
        restaurantId: restaurant.id
      })
    }

    return NextResponse.json({ 
      success: true, 
      reservation: data,
      restaurantId: restaurant.id
    })

  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}