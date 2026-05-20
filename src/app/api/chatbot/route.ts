import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ── RATE LIMITING ──────────────────────────────────────────
// Máximo 20 mensajes por IP cada 10 minutos
const RATE_LIMIT_MAX      = 20
const RATE_LIMIT_WINDOW   = 10 * 60 * 1000 // 10 minutos en ms

type RateLimitEntry = { count: number; resetAt: number }
const rateLimitMap = new Map<string, RateLimitEntry>()

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    // Primera petición o ventana expirada — resetear
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt }
}

// Limpiar entradas antiguas cada 15 minutos para evitar memory leaks
setInterval(() => {
  const now = Date.now()
  Array.from(rateLimitMap.entries()).forEach(([ip, entry]) => {
    if (now > entry.resetAt) rateLimitMap.delete(ip)
  })
}, 15 * 60 * 1000)

// ── CACHÉ ──────────────────────────────────────────────────
// Cachear respuestas a preguntas frecuentes durante 30 minutos
const CACHE_TTL = 30 * 60 * 1000 // 30 minutos

type CacheEntry = { response: string; expiresAt: number }
const responseCache = new Map<string, CacheEntry>()

function getCacheKey(lastMessage: string, lang: string, restaurantId?: string): string {
  // Normalizar el texto para mejorar los hits de caché
  const normalized = lastMessage.toLowerCase().trim().replace(/\s+/g, ' ')
  return `${restaurantId || 'default'}:${lang}:${normalized}`
}

function getFromCache(key: string): string | null {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key)
    return null
  }
  return entry.response
}

function setInCache(key: string, response: string): void {
  responseCache.set(key, {
    response,
    expiresAt: Date.now() + CACHE_TTL,
  })
  // Limitar el tamaño del caché a 500 entradas
  if (responseCache.size > 500) {
    const firstKey = responseCache.keys().next().value
    if (firstKey) responseCache.delete(firstKey)
  }
}

// ── PROMPT ─────────────────────────────────────────────────
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
  role: 'user' | 'assistant'
  content: string
}

function buildMenuContext(dishes: Dish[], lang: string): string {
  const available = dishes.filter(d => d.is_available)

  const dishList = available.map(d => {
    const allergens = d.dish_allergens.map(da => da.allergens.name).join(', ')
    const tags = [
      d.is_vegan ? 'vegano' : null,
      d.is_vegetarian && !d.is_vegan ? 'vegetariano' : null,
      d.is_gluten_free ? 'sin gluten' : null,
      d.is_meat ? 'contiene carne' : null,
      d.is_pescatarian ? 'contiene pescado' : null,
    ].filter(Boolean).join(', ')

    return `- ${d.name} | ${d.price.toFixed(2)}€ | ${d.description || 'Sin descripción'} | ${tags || 'sin etiquetas'} | Alérgenos: ${allergens || 'ninguno'}`
  }).join('\n')

  const langInstructions: Record<string, string> = {
    es: 'Responde siempre en español.',
    en: 'Always respond in English.',
    de: 'Antworte immer auf Deutsch.',
    fr: 'Réponds toujours en français.',
  }

  return `Eres el asistente virtual de este restaurante. Eres amable, conciso y útil.
${langInstructions[lang] || langInstructions.es}

Tu trabajo es:
- Responder preguntas sobre los platos, ingredientes, alérgenos y precios
- Hacer recomendaciones personalizadas según las preferencias del cliente
- Ayudar a clientes con alergias o dietas especiales
- Tomar nota de intención de reserva (nombre, fecha, hora, número de personas) y confirmar que el restaurante se pondrá en contacto

NO inventas información. Si no sabes algo, dilo honestamente.
Respuestas cortas y directas — máximo 3 frases salvo que te pidan detalle.

MENÚ DISPONIBLE HOY:
${dishList}`
}

// ── HANDLER ────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // Obtener IP del cliente
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous'

    // Comprobar rate limit
    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      const resetInMinutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        {
          error: `Demasiadas peticiones. Inténtalo de nuevo en ${resetInMinutes} minutos.`,
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      )
    }

    const body = await request.json()
    const { messages, dishes, lang, restaurantId } = body

    if (!messages || !dishes) {
      return NextResponse.json(
        { error: 'messages y dishes son obligatorios' },
        { status: 400 }
      )
    }

    // Solo cachear si el historial es de 1 mensaje (primera pregunta)
    // Las conversaciones con contexto no se cachean
    const lastMessage = messages[messages.length - 1]?.content || ''
    const shouldCache = messages.length === 1

    if (shouldCache) {
      const cacheKey = getCacheKey(lastMessage, lang || 'es', restaurantId)
      const cached = getFromCache(cacheKey)

      if (cached) {
        return NextResponse.json(
          { message: cached, cached: true },
          {
            headers: {
              'X-RateLimit-Remaining': String(rateLimit.remaining),
              'X-Cache': 'HIT',
            },
          }
        )
      }
    }

    // Llamada a Claude
    const systemPrompt = buildMenuContext(dishes, lang || 'es')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: systemPrompt,
      messages: messages.map((m: Message) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const text = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // Guardar en caché si aplica
    if (shouldCache && text) {
      const cacheKey = getCacheKey(lastMessage, lang || 'es', restaurantId)
      setInCache(cacheKey, text)
    }

    return NextResponse.json(
      { message: text, cached: false },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-Cache': 'MISS',
        },
      }
    )

  } catch (error) {
    console.error('Chatbot error:', error)
    return NextResponse.json(
      { error: 'Error al procesar el mensaje' },
      { status: 500 }
    )
  }
}