import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const RATE_LIMIT_MAX    = 20
const RATE_LIMIT_WINDOW = 10 * 60 * 1000

type RateLimitEntry = { count: number; resetAt: number }
const rateLimitMap = new Map<string, RateLimitEntry>()

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt }
}

setInterval(() => {
  const now = Date.now()
  Array.from(rateLimitMap.entries()).forEach(([ip, entry]) => {
    if (now > entry.resetAt) rateLimitMap.delete(ip)
  })
}, 15 * 60 * 1000)

const CACHE_TTL = 30 * 60 * 1000
type CacheEntry = { response: string; expiresAt: number }
const responseCache = new Map<string, CacheEntry>()

function getCacheKey(lastMessage: string, lang: string, restaurantId?: string): string {
  const normalized = lastMessage.toLowerCase().trim().replace(/\s+/g, " ")
  return `${restaurantId || "default"}:${lang}:${normalized}`
}

function getFromCache(key: string): string | null {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { responseCache.delete(key); return null }
  return entry.response
}

function setInCache(key: string, response: string): void {
  responseCache.set(key, { response, expiresAt: Date.now() + CACHE_TTL })
  if (responseCache.size > 500) {
    const firstKey = responseCache.keys().next().value
    if (firstKey) responseCache.delete(firstKey)
  }
}

type Dish = {
  name: string
  name_en: string
  description: string
  price: number
  is_available: boolean
  is_vegan: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  is_pescatarian: boolean
  is_meat: boolean
  dish_allergens: { allergens: { name: string; icon: string } }[]
}

type Message = {
  role: "user" | "assistant"
  content: string
}

function formatDateReadable(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr + "T12:00:00")
    const locales: Record<string, string> = { es: "es-ES", en: "en-GB", de: "de-DE", fr: "fr-FR" }
    return date.toLocaleDateString(locales[lang] || "es-ES", {
      weekday: "long", day: "numeric", month: "long",
    })
  } catch { return dateStr }
}

function buildMenuContext(dishes: Dish[], lang: string): string {
  const available = dishes.filter(d => d.is_available)
  const dishList = available.map(d => {
    const allergens = d.dish_allergens.map(da => da.allergens.name).join(", ")
    const tags = [
      d.is_vegan ? "vegano" : null,
      d.is_vegetarian && !d.is_vegan ? "vegetariano" : null,
      d.is_gluten_free ? "sin gluten" : null,
      d.is_meat ? "contiene carne" : null,
      d.is_pescatarian ? "contiene pescado" : null,
    ].filter(Boolean).join(", ")
    return `- ${d.name} | ${d.price.toFixed(2)}€ | ${d.description || "Sin descripción"} | ${tags || "sin etiquetas"} | Alérgenos: ${allergens || "ninguno"}`
  }).join("\n")

  const langInstructions: Record<string, string> = {
    es: "Responde siempre en español.",
    en: "Always respond in English.",
    de: "Antworte immer auf Deutsch.",
    fr: "Réponds toujours en français.",
  }

  const currentYear = new Date().getFullYear()

return `Eres el asistente virtual de este restaurante. Eres amable, conciso y útil.
El año actual es ${currentYear}. Cuando el cliente diga una fecha sin año, usa ${currentYear}.
${langInstructions[lang] || langInstructions.es}

Tu trabajo es:
- Responder preguntas sobre los platos, ingredientes, alérgenos y precios
- Hacer recomendaciones personalizadas según las preferencias del cliente
- Ayudar a clientes con alergias o dietas especiales
- Gestionar reservas de mesa

REGLAS PARA RESERVAS:
Cuando el cliente quiera reservar, pide TODOS los datos en UN SOLO mensaje:
"Para completar tu reserva necesito: nombre completo, fecha (por ejemplo: 15 de junio), hora y número de personas. ¿Me los indicas?"
Cuando el cliente responda con los datos, extráelos y responde ÚNICAMENTE con esta línea exacta (sin texto antes ni después):
RESERVA_LISTA:{"customer_name":"NOMBRE","reservation_date":"YYYY-MM-DD","reservation_time":"HH:MM","party_size":N,"customer_email":"","customer_phone":"","notes":""}

REGLAS IMPORTANTES:
- NO hagas preguntas una a una — recoge todo en UN solo mensaje
- Si faltan datos críticos (nombre, fecha, hora o personas) pídellos TODOS juntos
- Una vez tengas los 4 datos obligatorios responde SOLO con RESERVA_LISTA, sin texto adicional
- Las fechas siempre en formato YYYY-MM-DD usando el año ${currentYear} si no se especifica
- Ejemplos: "8 de junio" → "${currentYear}-06-08", "mañana" → calcula la fecha correcta
- El cliente puede escribir fechas en español, conviértelas siempre a YYYY-MM-DD
- Las horas siempre en formato HH:MM
- NO inventes información
- Respuestas cortas — máximo 3 frases salvo que te pidan detalle

MENÚ DISPONIBLE HOY:
${dishList}`
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous"

    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      const resetInMinutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Demasiadas peticiones. Inténtalo de nuevo en ${resetInMinutes} minutos.` },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { messages, dishes, lang, restaurantId } = body

    console.log("=== CHATBOT REQUEST ===", { restaurantId, lang, messagesCount: messages?.length })

    if (!messages || !dishes) {
      return NextResponse.json({ error: "messages y dishes son obligatorios" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]?.content || ""
    const shouldCache = messages.length === 1 && !lastMessage.toLowerCase().includes("reserva")

    if (shouldCache) {
      const cacheKey = getCacheKey(lastMessage, lang || "es", restaurantId)
      const cached = getFromCache(cacheKey)
      if (cached) return NextResponse.json({ message: cached, cached: true })
    }

    const systemPrompt = buildMenuContext(dishes, lang || "es")

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.map((m: Message) => ({ role: m.role, content: m.content })),
    })

    const rawText = response.content[0].type === "text" ? response.content[0].text : ""

    console.log("=== CLAUDE RESPONSE ===", { rawText, hasReserva: rawText.includes("RESERVA_LISTA:") })

    let finalText = rawText
    let reservationCreated = false
    let debugInfo: Record<string, unknown> = { restaurantId, rawTextPreview: rawText.slice(0, 100) }

    if (rawText.includes("RESERVA_LISTA:")) {
      console.log("=== DETECTADA RESERVA ===")
      try {
        const jsonMatch = rawText.match(/RESERVA_LISTA:(\{[^}]+\})/)
        console.log("jsonMatch:", jsonMatch?.[1])

        if (jsonMatch) {
          const reservationData = JSON.parse(jsonMatch[1])
          console.log("reservationData:", reservationData)

          const hasRequiredData =
            reservationData.customer_name &&
            reservationData.reservation_date &&
            reservationData.reservation_time &&
            reservationData.party_size

          debugInfo = { ...debugInfo, hasRequiredData, restaurantId }
          console.log("hasRequiredData:", hasRequiredData, "restaurantId:", restaurantId)

          if (hasRequiredData && restaurantId) {
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

            const insertData = {
              restaurant_id: restaurantId,
              customer_name: String(reservationData.customer_name).trim(),
              customer_email: reservationData.customer_email || null,
              customer_phone: reservationData.customer_phone || null,
              party_size: Number(reservationData.party_size),
              reservation_date: reservationData.reservation_date,
              reservation_time: reservationData.reservation_time,
              notes: reservationData.notes || null,
              source: "chatbot",
              status: "pending",
            }

            console.log("=== INSERTANDO EN SUPABASE ===", insertData)

            const { data: inserted, error: insertError } = await supabase
              .from("reservations")
              .insert(insertData)
              .select()
              .single()

            if (insertError) {
              console.error("=== ERROR INSERT ===", insertError)
              debugInfo = { ...debugInfo, insertError: insertError.message }
            } else {
              console.log("=== RESERVA GUARDADA ===", inserted)
              reservationCreated = true
              debugInfo = { ...debugInfo, inserted }
            }
          } else {
            console.log("=== NO SE INSERTA ===", { hasRequiredData, restaurantId })
          }

          const partySize    = Number(reservationData.party_size)
          const time         = reservationData.reservation_time?.slice(0, 5)
          const dateReadable = formatDateReadable(reservationData.reservation_date, lang || "es")

          const confirmMsg: Record<string, string> = {
            es: `✅ **¡Reserva recibida!**\n\nHemos anotado tu mesa:\n📅 ${dateReadable} a las ${time}h\n👥 ${partySize} persona${partySize > 1 ? "s" : ""}\n\nEl restaurante confirmará tu solicitud en breve. ¡Hasta pronto! 😊`,
            en: `✅ **Reservation received!**\n\nWe've noted your table:\n📅 ${dateReadable} at ${time}\n👥 ${partySize} person${partySize > 1 ? "s" : ""}\n\nThe restaurant will confirm shortly. See you soon! 😊`,
            de: `✅ **Reservierung erhalten!**\n\nWir haben Ihren Tisch notiert:\n📅 ${dateReadable} um ${time} Uhr\n👥 ${partySize} Person${partySize > 1 ? "en" : ""}\n\nDas Restaurant bestätigt bald. Bis bald! 😊`,
            fr: `✅ **Réservation reçue!**\n\nNous avons noté votre table:\n📅 ${dateReadable} à ${time}\n👥 ${partySize} personne${partySize > 1 ? "s" : ""}\n\nLe restaurant confirmera bientôt. À bientôt! 😊`,
          }

          finalText = confirmMsg[lang || "es"] || confirmMsg["es"]
        }
      } catch (e) {
        console.error("=== ERROR PROCESANDO RESERVA ===", e)
        finalText = rawText.replace(/RESERVA_LISTA:[^\n]*/g, "").trim()
        if (!finalText) {
          finalText = lang === "es"
            ? "Ha habido un problema al procesar tu reserva. Por favor inténtalo de nuevo."
            : "There was a problem processing your reservation. Please try again."
        }
      }
    }

    if (shouldCache && finalText && !reservationCreated) {
      const cacheKey = getCacheKey(lastMessage, lang || "es", restaurantId)
      setInCache(cacheKey, finalText)
    }

    return NextResponse.json({
      message: finalText,
      cached: false,
      reservationCreated,
      debug: debugInfo,
    })

  } catch (error) {
    console.error("Chatbot error:", error)
    return NextResponse.json({ error: "Error al procesar el mensaje" }, { status: 500 })
  }
}