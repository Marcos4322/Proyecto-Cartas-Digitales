import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const restaurantId = formData.get('restaurant_id') as string

  if (!file || !restaurantId) {
    return NextResponse.json(
      { error: 'file y restaurant_id son obligatorios' },
      { status: 400 }
    )
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${restaurantId}/${Date.now()}.${fileExt}`

  const { error } = await supabase.storage
    .from('dish-images')
    .upload(fileName, file, { upsert: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('dish-images')
    .getPublicUrl(fileName)

  return NextResponse.json({ url: urlData.publicUrl })
}