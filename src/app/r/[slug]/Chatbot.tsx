'use client'

import { useState, useRef, useEffect } from 'react'

type Lang = 'es' | 'en' | 'de' | 'fr'

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  time: string
}

type Dish = {
  id: string
  name: string
  name_en: string
  name_de: string
  name_fr: string
  description: string
  description_en: string
  description_de: string
  description_fr: string
  price: number
  is_available: boolean
  is_vegan: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  is_pescatarian: boolean
  is_meat: boolean
  dish_allergens: { allergens: { name: string; icon: string } }[]
}

type Props = {
  lang: Lang
  restaurantName: string
  dishes: Dish[]
  restaurantId: string
}

const UI = {
  title:       { es: 'Asistente IA',        en: 'AI Assistant',        de: 'KI-Assistent',        fr: 'Assistant IA'         },
  subtitle:    { es: 'Carta y reservas',     en: 'Menu & reservations', de: 'Karte & Reservierung', fr: 'Carte & réservations' },
  placeholder: { es: 'Escribe tu pregunta...', en: 'Type your question...', de: 'Frage eingeben...', fr: 'Tapez votre question...' },
  open:        { es: '¿Tienes alguna pregunta?', en: 'Any questions?', de: 'Fragen?', fr: 'Des questions?' },
  error:       { es: 'Error al responder. Inténtalo de nuevo.', en: 'Error responding. Please try again.', de: 'Fehler. Bitte erneut versuchen.', fr: 'Erreur. Veuillez réessayer.' },
  suggestions: {
    es: ['¿Tenéis opciones veganas?', '¿Qué platos no tienen gluten?', 'Quiero hacer una reserva', '¿Cuál es el plato del día?'],
    en: ['Do you have vegan options?', 'Which dishes are gluten-free?', 'I want to make a reservation', "What's today's special?"],
    de: ['Gibt es vegane Optionen?', 'Welche Gerichte sind glutenfrei?', 'Ich möchte reservieren', 'Was ist das Tagesgericht?'],
    fr: ['Avez-vous des options veganes?', 'Quels plats sont sans gluten?', 'Je veux faire une réservation', "Quel est le plat du jour?"],
  }
}

function t(key: keyof typeof UI, lang: Lang): string {
  const val = UI[key]
  if (typeof val === 'object' && !Array.isArray(val)) {
    return (val as Record<Lang, string>)[lang] || (val as Record<Lang, string>)['es']
  }
  return String(val)
}

function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

export default function Chatbot({ lang, restaurantName, dishes, restaurantId }: Props) {
  const [isOpen, setIsOpen]                   = useState(false)
  const [messages, setMessages]               = useState<Message[]>([])
  const [input, setInput]                     = useState('')
  const [isTyping, setIsTyping]               = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)

  const suggestions = UI.suggestions[lang] || UI.suggestions['es']

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: Message = {
        id: 'welcome',
        role: 'assistant',
        text: lang === 'es'
          ? `¡Hola! Soy el asistente de **${restaurantName}**. Puedo ayudarte con preguntas sobre la carta, alérgenos, precios o hacer una reserva. ¿En qué te ayudo? 😊`
          : lang === 'en'
          ? `Hello! I'm **${restaurantName}**'s assistant. I can help with menu questions, allergens, prices or reservations. How can I help? 😊`
          : lang === 'de'
          ? `Hallo! Ich bin der Assistent von **${restaurantName}**. Ich helfe mit Fragen zur Speisekarte, Allergenen, Preisen oder Reservierungen. 😊`
          : `Bonjour! Je suis l'assistant de **${restaurantName}**. Je peux vous aider avec la carte, les allergènes, les prix ou les réservations. 😊`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages([welcome])
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setShowSuggestions(false)
    setIsTyping(true)

    try {
      // Filtrar mensaje de bienvenida — solo enviar mensajes reales
      const apiMessages = updatedMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.text }))

      // Garantizar que empieza por 'user'
      const firstUserIndex = apiMessages.findIndex(m => m.role === 'user')
      const filteredMessages = firstUserIndex >= 0
        ? apiMessages.slice(firstUserIndex)
        : apiMessages

      // Log para debug
      console.log('Enviando al chatbot:', {
        restaurantId,
        messagesCount: filteredMessages.length,
        firstMessage: filteredMessages[0],
      })

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: filteredMessages,
          dishes,
          lang,
          restaurantId,
        }),
      })

      const data = await res.json()

      // Log respuesta
      console.log('Respuesta chatbot:', {
        ok: res.ok,
        status: res.status,
        reservationCreated: data.reservationCreated,
        debug: data.debug,
      })

      const botText = res.ok
        ? data.message
        : res.status === 429
          ? (lang === 'es' ? '⏳ Has enviado demasiados mensajes. Inténtalo en unos minutos.'
           : lang === 'en' ? '⏳ Too many messages. Please try again in a few minutes.'
           : lang === 'de' ? '⏳ Zu viele Nachrichten. Bitte warte einige Minuten.'
           : '⏳ Trop de messages. Réessayez dans quelques minutes.')
          : t('error', lang)

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: botText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])

    } catch (err) {
      console.error('Error en chatbot:', err)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: t('error', lang),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden"
          style={{ height: '500px' }}
        >
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <p className="text-white font-bold text-sm">{t('title', lang)}</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                  <p className="text-orange-100 text-xs">{t('subtitle', lang)}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-orange-200 transition w-7 h-7 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-10"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs mr-1.5 shrink-0 mt-1">
                    🤖
                  </div>
                )}
                <div className={`max-w-56 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-orange-500 text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 shadow-sm rounded-tl-sm'
                    }`}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                  />
                  <span className="text-xs text-gray-400 mt-0.5 px-1">{msg.time}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start items-center gap-1.5">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs shrink-0">
                  🤖
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {showSuggestions && messages.length <= 1 && (
              <div className="space-y-1.5 mt-1">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="w-full text-left text-xs bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-gray-600 px-3 py-2 rounded-xl transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('placeholder', lang)}
              className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">
        {!isOpen && (
          <div className="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-md border border-gray-100 animate-bounce">
            {t('open', lang)}
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition-all duration-300 ${
            isOpen ? 'bg-gray-700 hover:bg-gray-800' : 'bg-orange-500 hover:bg-orange-600 hover:scale-110'
          }`}
        >
          {isOpen ? '✕' : '💬'}
        </button>
      </div>
    </>
  )
}