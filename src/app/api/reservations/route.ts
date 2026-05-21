import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — Listar reservas de un restaurante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurant_id')
  const status = searchParams.get('status')
  const date = searchParams.get('date')

  if (!restaurantId) {
    return NextResponse.json(
      { error: 'restaurant_id es obligatorio' },
      { status: 400 }
    )
  }

  let query = supabase
    .from('reservations')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })

  if (status) query = query.eq('status', status)
  if (date) query = query.eq('reservation_date', date)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST — Crear una reserva nueva
export async function POST(request: Request) {
  const body = await request.json()
  const {
    restaurant_id,
    customer_name,
    customer_email,
    customer_phone,
    party_size,
    reservation_date,
    reservation_time,
    notes,
    source,
  } = body

  if (!restaurant_id || !customer_name || !reservation_date || !reservation_time || !party_size) {
    return NextResponse.json(
      { error: 'restaurant_id, customer_name, reservation_date, reservation_time y party_size son obligatorios' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert([{
      restaurant_id,
      customer_name,
      customer_email,
      customer_phone,
      party_size,
      reservation_date,
      reservation_time,
      notes,
      source: source || 'chatbot',
      status: 'pending',
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// PATCH — Actualizar estado de una reserva
export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, status, notes } = body

  if (!id || !status) {
    return NextResponse.json(
      { error: 'id y status son obligatorios' },
      { status: 400 }
    )
  }

  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status debe ser uno de: ${validStatuses.join(', ')}` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('reservations')
    .update({ status, notes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE — Eliminar una reserva
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'id es obligatorio' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}