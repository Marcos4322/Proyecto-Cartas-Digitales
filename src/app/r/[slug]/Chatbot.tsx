'use client'

import { useState, useRef, useEffect } from 'react'

type Lang = 'es' | 'en' | 'de' | 'fr'

type Message = {
  id: string
  role: 'user' | 'bot'
  text: string
  time: string
}

type Dish = {
  id: string
  name: string
  name_en: string
  price: number
  is_available: boolean
  is_vegan: boolean
  is_gluten_free: boolean
}

type Props = {
  lang: Lang
  restaurantName: string
  dishes: Dish[]
}

const UI = {
  title: { es: 'Asistente', en: 'Assistant', de: 'Assistent', fr: 'Assistant' },
  subtitle: { es: 'Te ayudo con la carta y reservas', en: 'I help with the menu and reservations', de: 'Ich helfe mit der Karte', fr: 'Je vous aide avec la carte' },
  placeholder: { es: 'Escribe tu pregunta...', en: 'Type your question...', de: 'Frage eingeben...', fr: 'Tapez votre question...' },
  open: { es: '¿Tienes alguna pregunta?', en: 'Any questions?', de: 'Fragen?', fr: 'Des questions?' },
  suggestions: {
    es: ['¿Tenéis opciones veganas?', '¿Qué platos no tienen gluten?', '¿Cómo puedo hacer una reserva?', '¿Cuál es el plato del día?'],
    en: ['Do you have vegan options?', 'Which dishes are gluten-free?', 'How can I make a reservation?', 'What is the dish of the day?'],
    de: ['Gibt es vegane Optionen?', 'Welche Gerichte sind glutenfrei?', 'Wie kann ich reservieren?', 'Was ist das Tagesgericht?'],
    fr: ['Avez-vous des options veganes?', 'Quels plats sont sans gluten?', 'Comment faire une reservation?', 'Quel est le plat du jour?'],
  }
}

function t(key: keyof typeof UI, lang: Lang): string {
  const val = UI[key]
  if (typeof val === 'object' && !Array.isArray(val)) {
    return (val as Record<Lang, string>)[lang] || (val as Record<Lang, string>)['es']
  }
  return String(val)
}

function generateBotResponse(userText: string, lang: Lang, dishes: Dish[], restaurantName: string): string {
  const text = userText.toLowerCase()

  // Respuestas sobre vegano
  if (text.includes('vegan') || text.includes('vegano') || text.includes('vegana')) {
    const veganDishes = dishes.filter(d => d.is_vegan && d.is_available)
    if (veganDishes.length === 0) {
      return lang === 'es' ? 'Lo siento, en este momento no tenemos platos veganos disponibles.' :
             lang === 'en' ? 'Sorry, we currently have no vegan dishes available.' :
             lang === 'de' ? 'Es tut uns leid, wir haben aktuell keine veganen Gerichte.' :
             'Desolé, nous n\'avons pas de plats vegans disponibles.'
    }
    const names = veganDishes.map(d => lang === 'es' ? d.name : d.name_en || d.name).join(', ')
    return lang === 'es' ? `Tenemos estos platos veganos: ${names}. ¡Todos deliciosos! 🌱` :
           lang === 'en' ? `We have these vegan dishes: ${names}. All delicious! 🌱` :
           lang === 'de' ? `Wir haben diese veganen Gerichte: ${names}. Alle lecker! 🌱` :
           `Nous avons ces plats vegans: ${names}. Tous delicieux! 🌱`
  }

  // Respuestas sobre sin gluten
  if (text.includes('gluten') || text.includes('celiaco') || text.includes('celíaco')) {
    const gfDishes = dishes.filter(d => d.is_gluten_free && d.is_available)
    if (gfDishes.length === 0) {
      return lang === 'es' ? 'En este momento no tenemos platos certificados sin gluten. Consulta con nuestro personal.' :
             'We currently have no certified gluten-free dishes. Please ask our staff.'
    }
    const names = gfDishes.map(d => lang === 'es' ? d.name : d.name_en || d.name).join(', ')
    return lang === 'es' ? `Nuestros platos sin gluten son: ${names}. 🌾` :
           lang === 'en' ? `Our gluten-free dishes are: ${names}. 🌾` :
           lang === 'de' ? `Unsere glutenfreien Gerichte: ${names}. 🌾` :
           `Nos plats sans gluten: ${names}. 🌾`
  }

  // Respuestas sobre reserva
  if (text.includes('reserva') || text.includes('reservation') || text.includes('reservar') || text.includes('book') || text.includes('tisch')) {
    return lang === 'es' ? `Para hacer una reserva en ${restaurantName} puedes llamarnos o escribirnos directamente. ¡Estaremos encantados de atenderte! 📞` :
           lang === 'en' ? `To make a reservation at ${restaurantName}, you can call us or write to us directly. We would be happy to help! 📞` :
           lang === 'de' ? `Um bei ${restaurantName} zu reservieren, rufen Sie uns an oder schreiben Sie uns. Wir helfen gerne! 📞` :
           `Pour reserver chez ${restaurantName}, appelez-nous ou ecrivez-nous. Nous serons ravis de vous aider! 📞`
  }

  // Respuestas sobre precio / carta
  if (text.includes('precio') || text.includes('price') || text.includes('preis') || text.includes('combien') || text.includes('caro') || text.includes('barato')) {
    const cheapest = dishes.filter(d => d.is_available).sort((a, b) => a.price - b.price)[0]
    const mostExpensive = dishes.filter(d => d.is_available).sort((a, b) => b.price - a.price)[0]
    if (!cheapest) return lang === 'es' ? 'Consulta nuestra carta completa para ver los precios.' : 'Check our full menu for prices.'
    return lang === 'es' ? `Nuestros precios van desde ${cheapest.price}€ hasta ${mostExpensive.price}€. Tenemos opciones para todos los gustos. 😊` :
           lang === 'en' ? `Our prices range from €${cheapest.price} to €${mostExpensive.price}. We have options for everyone. 😊` :
           lang === 'de' ? `Unsere Preise reichen von ${cheapest.price}€ bis ${mostExpensive.price}€. 😊` :
           `Nos prix vont de ${cheapest.price}€ a ${mostExpensive.price}€. 😊`
  }

  // Respuesta sobre plato del día
  if (text.includes('plato del día') || text.includes('dish of the day') || text.includes('tagesgericht') || text.includes('plat du jour') || text.includes('especial')) {
    const featured = dishes.filter(d => d.is_available)
    if (featured.length > 0) {
      const random = featured[Math.floor(Math.random() * featured.length)]
      const name = lang === 'es' ? random.name : random.name_en || random.name
      return lang === 'es' ? `Hoy te recomendamos especialmente: ${name} por ${random.price}€. ¡Está delicioso! ⭐` :
             lang === 'en' ? `Today we especially recommend: ${name} for €${random.price}. It's delicious! ⭐` :
             lang === 'de' ? `Heute empfehlen wir besonders: ${name} fur ${random.price}€. ⭐` :
             `Aujourd'hui nous recommandons: ${name} pour ${random.price}€. ⭐`
    }
  }

  // Respuesta sobre alérgenos
  if (text.includes('alergen') || text.includes('allergen') || text.includes('alergia') || text.includes('allergy') || text.includes('intolerancia')) {
    return lang === 'es' ? 'Todos nuestros platos tienen los alérgenos indicados con iconos en la carta. Si tienes alguna alergia grave, por favor consulta con nuestro personal antes de pedir. ⚠️' :
           lang === 'en' ? 'All our dishes have allergens indicated with icons on the menu. If you have a severe allergy, please consult our staff before ordering. ⚠️' :
           lang === 'de' ? 'Alle unsere Gerichte haben Allergene mit Symbolen in der Speisekarte. Bei schweren Allergien fragen Sie bitte unser Personal. ⚠️' :
           'Tous nos plats ont les allergenes indiques avec des icones. En cas d\'allergie grave, consultez notre personnel. ⚠️'
  }

  // Respuesta por defecto
  return lang === 'es' ? `Hola! Estoy aquí para ayudarte con cualquier pregunta sobre la carta de ${restaurantName}. Puedes preguntarme sobre platos veganos, alérgenos, precios o reservas. 😊` :
         lang === 'en' ? `Hello! I'm here to help you with any questions about ${restaurantName}'s menu. You can ask me about vegan dishes, allergens, prices or reservations. 😊` :
         lang === 'de' ? `Hallo! Ich bin hier, um Ihnen bei Fragen zur Speisekarte von ${restaurantName} zu helfen. Fragen Sie mich nach veganen Gerichten, Allergenen, Preisen oder Reservierungen. 😊` :
         `Bonjour! Je suis ici pour vous aider avec toutes questions sur la carte de ${restaurantName}. Posez-moi des questions sur les plats vegans, les allergenes, les prix ou les reservations. 😊`
}

export default function Chatbot({ lang, restaurantName, dishes }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = UI.suggestions[lang] || UI.suggestions['es']

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: Message = {
        id: '1',
        role: 'bot',
        text: lang === 'es' ? `Hola! Soy el asistente de ${restaurantName}. ¿En qué puedo ayudarte? 😊` :
              lang === 'en' ? `Hello! I'm ${restaurantName}'s assistant. How can I help you? 😊` :
              lang === 'de' ? `Hallo! Ich bin der Assistent von ${restaurantName}. Wie kann ich helfen? 😊` :
              `Bonjour! Je suis l'assistant de ${restaurantName}. Comment puis-je vous aider? 😊`,
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
    if (!text.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setShowSuggestions(false)
    setIsTyping(true)

    // Simular tiempo de respuesta
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600))

    const botResponse = generateBotResponse(text, lang, dishes, restaurantName)
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      text: botResponse,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setIsTyping(false)
    setMessages(prev => [...prev, botMsg])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* VENTANA DE CHAT */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="bg-orange-500 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <p className="text-white font-bold text-sm">{t('title', lang)}</p>
                <p className="text-orange-100 text-xs">{t('subtitle', lang)}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-orange-200 transition text-lg font-bold w-7 h-7 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs mr-1.5 shrink-0 mt-1">
                    🤖
                  </div>
                )}
                <div className={`max-w-52 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 shadow-sm rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-xs text-gray-400 mt-0.5 px-1">{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
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

            {/* Sugerencias */}
            {showSuggestions && messages.length <= 1 && (
              <div className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="w-full text-left text-xs bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-gray-700 px-3 py-2 rounded-xl transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
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

      {/* BOTÓN FLOTANTE */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">
        {!isOpen && (
          <div className="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-md border border-gray-100 animate-bounce">
            {t('open', lang)}
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition-all duration-300 ${
            isOpen
              ? 'bg-gray-700 hover:bg-gray-800 rotate-0'
              : 'bg-orange-500 hover:bg-orange-600 hover:scale-110'
          }`}
        >
          {isOpen ? '✕' : '💬'}
        </button>
      </div>
    </>
  )
}