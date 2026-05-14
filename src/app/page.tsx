'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'

export default function LandingPage() {
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const steps = [
    {
      icon: '📱',
      title: 'Escanea el QR',
      desc: 'El cliente escanea el código QR de la mesa. Sin apps, sin descargas. Se abre directamente en el navegador.',
    },
    {
      icon: '✨',
      title: 'Declara sus gustos',
      desc: 'En 3 pasos rápidos indica sus alergias, preferencias de dieta y qué le apetece hoy.',
    },
    {
      icon: '🍽️',
      title: 'Recibe recomendaciones',
      desc: 'La carta se personaliza al instante mostrando primero los platos que mejor encajan con sus preferencias.',
    },
  ]

  const features = [
    { icon: '🌍', title: '4 idiomas automáticos', desc: 'La carta se traduce automáticamente al inglés, alemán y francés. El restaurante solo escribe en español.' },
    { icon: '⚠️', title: 'Alérgenos europeos', desc: 'Los 14 alérgenos de declaración obligatoria según el Reglamento UE 1169/2011, con iconos visuales.' },
    { icon: '📊', title: 'Analytics en tiempo real', desc: 'Sabe qué platos son más vistos, qué filtros usan tus clientes y desde qué países te visitan.' },
    { icon: '⚡', title: 'Stock en tiempo real', desc: 'Marca un plato como agotado desde el panel admin y se actualiza al instante en la carta.' },
    { icon: '🤖', title: 'Chatbot asistente', desc: 'El cliente puede preguntar sobre alérgenos, precios o hacer una reserva directamente desde la carta.' },
    { icon: '❤️', title: 'Sistema de Me Gusta', desc: 'Los clientes pueden marcar sus platos favoritos. El restaurante ve qué platos generan más engagement.' },
  ]

  const plans = [
    {
      name: 'Básico', monthlyPrice: 29, annualPrice: 24,
      description: 'Para bares y cafeterías',
      color: 'border-gray-200', badge: null,
      features: ['Carta digital QR ilimitada', 'Filtros por categoría', '2 idiomas (ES/EN)', 'Gestión de alérgenos', 'Panel admin básico', 'Soporte por email'],
      notIncluded: ['Analytics avanzados', 'Traducción automática', 'Chatbot IA', '4 idiomas'],
      cta: 'Empezar gratis', ctaStyle: 'border-2 border-orange-500 text-orange-500 hover:bg-orange-50',
    },
    {
      name: 'Pro', monthlyPrice: 89, annualPrice: 74,
      description: 'Para restaurantes y hoteles',
      color: 'border-orange-500', badge: 'Más popular',
      features: ['Todo lo del plan Básico', '4 idiomas (ES/EN/DE/FR)', 'Traducción automática IA', 'Analytics en tiempo real', 'Dashboard con gráficos', 'Sistema de Me Gusta', 'Chatbot asistente', 'Wizard de preferencias', 'Soporte prioritario'],
      notIncluded: ['UI personalizada', 'SLA dedicado'],
      cta: 'Empezar prueba gratis', ctaStyle: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    {
      name: 'Premium', monthlyPrice: 299, annualPrice: 249,
      description: 'Para cadenas y hoteles de lujo',
      color: 'border-gray-200', badge: null,
      features: ['Todo lo del plan Pro', 'UI completamente personalizada', 'Dominio propio', 'SLA 99.9% uptime', 'Integraciones a medida', 'Onboarding dedicado', 'Account manager', 'Facturación personalizada'],
      notIncluded: [],
      cta: 'Contactar ventas', ctaStyle: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
    },
  ]

  const faqs = [
    { q: '¿Necesito instalar alguna app?', a: 'No. MenuAI es una PWA. El cliente escanea el QR y la carta se abre directamente en el navegador de su móvil, sin descargas.' },
    { q: '¿Cuánto tiempo lleva configurar la carta?', a: 'En menos de 30 minutos puedes tener tu carta digital funcionando. Solo necesitas añadir tus platos, categorías y escanear el QR.' },
    { q: '¿Las traducciones son de calidad?', a: 'Sí. Usamos IA para traducir los nombres y descripciones de los platos al inglés, alemán y francés con contexto gastronómico.' },
    { q: '¿Puedo probar MenuAI antes de pagar?', a: 'Sí. Todos los planes incluyen 14 días de prueba gratuita sin necesidad de tarjeta de crédito.' },
    { q: '¿Qué pasa si tengo muchos clientes al mismo tiempo?', a: 'MenuAI está construido sobre Supabase y Vercel, infraestructura que escala automáticamente sin límite de concurrencia.' },
    { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí, puedes subir o bajar de plan cuando quieras. El cambio se aplica inmediatamente y se ajusta el precio proporcionalmente.' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-black text-gray-900">
              Menu<span className="text-orange-500">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['#como-funciona', '#funcionalidades', '#precios', '#faq'].map((href, i) => (
              <button
                key={i}
                onClick={() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-gray-600 hover:text-orange-500 transition"
              >
                {['Cómo funciona', 'Funcionalidades', 'Precios', 'FAQ'][i]}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => window.open('/r/la-taberna-del-puerto', '_blank')}
              className="text-sm text-gray-600 hover:text-orange-500 font-medium transition"
            >
              Ver demo
            </button>
            <button
              onClick={() => document.querySelector('#precios')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl transition"
            >
              Empezar gratis
            </button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-600 p-2">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
            {['#como-funciona', '#funcionalidades', '#precios', '#faq'].map((href, i) => (
              <button
                key={i}
                onClick={() => { document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false) }}
                className="block text-sm text-gray-600 hover:text-orange-500 py-1 w-full text-left"
              >
                {['Cómo funciona', 'Funcionalidades', 'Precios', 'FAQ'][i]}
              </button>
            ))}
            <button
              onClick={() => document.querySelector('#precios')?.scrollIntoView({ behavior: 'smooth' })}
              className="block w-full text-sm bg-orange-500 text-white font-semibold px-4 py-2 rounded-xl text-center mt-2"
            >
              Empezar gratis
            </button>
          </div>
        )}
      </nav>
      {/* HERO */}
      <section className="pt-28 pb-20 px-6 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
            La carta que se adapta<br />
            <span className="text-orange-500">a cada cliente</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            MenuAI analiza las preferencias de tus clientes al escanear el QR y les muestra los platos perfectos para ellos. En 4 idiomas. Con alérgenos. En tiempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <button
              onClick={() => document.querySelector('#precios')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition text-lg shadow-lg shadow-orange-200"
            >
              Prueba gratis 14 días →
            </button>
            <button
              onClick={() => window.open('/r/la-taberna-del-puerto', '_blank')}
              className="border-2 border-gray-200 hover:border-orange-300 text-gray-700 font-bold px-8 py-4 rounded-2xl transition text-lg"
            >
              📱 Ver demo en vivo
            </button>
          </div>
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[{ value: '4', label: 'idiomas' }, { value: '14', label: 'alérgenos UE' }, { value: '100%', label: 'sin app' }].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl font-black text-orange-500">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">Así de sencillo</p>
            <h2 className="text-4xl font-black text-gray-900">Cómo funciona MenuAI</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5 border border-orange-100">
                  {step.icon}
                </div>
                <div className="w-7 h-7 bg-orange-500 text-white text-xs font-black rounded-full flex items-center justify-center mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

                        {/* SECCIÓN QR */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">
              Pruébalo ahora mismo
            </p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Escanea y descubre MenuAI
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Apunta la cámara de tu móvil al QR y verás exactamente lo que verán
              tus clientes cuando escaneen la carta de tu restaurante.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12">

            {/* QR */}
            <div className="bg-white rounded-3xl border-2 border-orange-100 shadow-xl p-8 flex flex-col items-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Carta demo — La Taberna del Puerto
              </p>
              <div className="p-4 bg-white rounded-2xl border border-gray-100">
                <QRCode
                  value="https://proyecto-cartas-digitales.vercel.app/r/la-taberna-del-puerto"
                  size={180}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center max-w-48">
                Apunta la cámara de tu móvil para ver la carta en vivo
              </p>
              <button
                onClick={() => window.open('/r/la-taberna-del-puerto', '_blank')}
                className="mt-4 text-sm font-semibold text-orange-500 hover:text-orange-600 underline transition"
              >
                O ábrela en el navegador →
              </button>
            </div>

            {/* Pasos */}
            <div className="space-y-6 max-w-xs">
              {[
                { icon: '📱', step: '1', title: 'Abre la cámara', desc: 'Sin apps ni descargas. Solo la cámara de tu móvil.' },
                { icon: '🎯', step: '2', title: 'Apunta al QR', desc: 'El móvil detecta el código automáticamente.' },
                { icon: '✨', step: '3', title: 'Explora la carta', desc: 'Verás la carta personalizada con filtros, idiomas y Me Gusta.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-orange-100">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 bg-orange-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                        {item.step}
                      </span>
                      <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                    </div>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* DEMO PREVIEW */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-6 text-white">
              <p className="text-sm font-medium text-orange-100">Restaurante demo</p>
              <h3 className="text-xl font-bold">La Taberna del Puerto</h3>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {['Todo', 'Entrantes', 'Arroces', 'Pescados', 'Carnes', 'Postres'].map(cat => (
                  <span key={cat} className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${cat === 'Todo' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {cat}
                  </span>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Paella valenciana', price: '16.50', badge: '⭐ Recomendado', green: false },
                  { name: 'Ensalada mediterránea', price: '9.00', badge: '🌱 Vegano', green: true },
                  { name: 'Lubina a la sal', price: '22.00', badge: '⭐ Recomendado', green: false },
                ].map((dish, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${dish.green ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                        {dish.badge}
                      </span>
                      <p className="font-semibold text-gray-900 mt-1">{dish.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-orange-500">{dish.price} €</span>
                      <span className="text-lg">🤍</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => window.open('/r/la-taberna-del-puerto', '_blank')}
                className="w-full mt-4 text-center text-sm font-semibold text-orange-500 hover:text-orange-600 py-2 border border-dashed border-orange-200 rounded-xl transition"
              >
                Ver carta completa en vivo →
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* DEMO ADMIN PREVIEW */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">
              Panel de administración
            </p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Gestiona tu carta en segundos
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Desde el panel admin puedes crear platos, cambiar el stock en tiempo real,
              subir imágenes y consultar las métricas de tu carta.
            </p>
          </div>

          <div className="bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden shadow-lg">

            {/* Header del panel */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div>
                <p className="text-lg font-bold text-gray-900">Panel Admin</p>
                <p className="text-sm text-gray-400">La Taberna del Puerto</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-purple-500 font-medium border border-purple-200 px-4 py-2 rounded-xl">
                  📊 Analytics
                </div>
                <div className="text-sm text-orange-500 font-medium border border-orange-200 px-4 py-2 rounded-xl">
                  Ver carta
                </div>
                <div className="text-sm bg-orange-500 text-white font-semibold px-4 py-2 rounded-xl">
                  + Nuevo plato
                </div>
              </div>
            </div>


            {/* Tabla de platos demo */}
            <div className="p-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">Platos (6)</p>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Plato', 'Categoría', 'Precio', 'Stock', 'Acciones'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { name: 'Paella valenciana', emoji: '🥘', cat: 'Arroces', price: '16.50', available: true, featured: true },
                      { name: 'Croquetas de bacalao', emoji: '🍽️', cat: 'Entrantes', price: '8.50', available: true, featured: true },
                      { name: 'Lubina a la sal', emoji: '🐟', cat: 'Pescados', price: '22.00', available: true, featured: true },
                      { name: 'Pulpo a la gallega', emoji: '🦑', cat: 'Pescados', price: '18.50', available: false, featured: false },
                      { name: 'Tarta de queso', emoji: '🍰', cat: 'Postres', price: '7.00', available: true, featured: true },
                      { name: 'Chuletón de buey', emoji: '🥩', cat: 'Carnes', price: '32.00', available: true, featured: true },
                    ].map((dish, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">
                              {dish.emoji}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{dish.name}</p>
                              {dish.featured && <span className="text-xs text-orange-500">⭐ Recomendado</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500">{dish.cat}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-orange-500 text-sm">{dish.price} €</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`relative inline-flex h-5 w-9 items-center rounded-full ${dish.available ? 'bg-green-500' : 'bg-gray-300'}`}>
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${dish.available ? 'translate-x-5' : 'translate-x-1'}`} />
                            </div>
                            <span className={`text-xs font-medium ${dish.available ? 'text-green-600' : 'text-gray-400'}`}>
                              {dish.available ? 'Disponible' : 'Agotado'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1.5 rounded-lg">Editar</span>
                            <span className="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-lg">Eliminar</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => window.open('/admin/la-taberna-del-puerto', '_blank')}
                className="mt-4 w-full text-center text-sm font-semibold text-orange-500 hover:text-orange-600 py-3 border border-dashed border-orange-200 rounded-xl transition"
              >
                Ver panel admin en vivo →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">Todo incluido</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Todo lo que necesita tu restaurante</h2>
            <p className="text-gray-500 max-w-xl mx-auto">MenuAI no es solo una carta digital. Es una plataforma completa diseñada para mejorar la experiencia del cliente y aumentar tus ventas.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition group">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:bg-orange-100 transition">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">Precios</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Simple y transparente</h2>
            <p className="text-gray-500 mb-8">14 días gratis en todos los planes. Sin tarjeta de crédito.</p>
            <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full p-1">
              <button
                onClick={() => setBillingAnnual(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${!billingAnnual ? 'bg-orange-500 text-white' : 'text-gray-500'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${billingAnnual ? 'bg-orange-500 text-white' : 'text-gray-500'}`}
              >
                Anual <span className="text-xs text-green-500 font-bold">-17%</span>
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className={`bg-white rounded-3xl border-2 ${plan.color} p-8 relative flex flex-col ${plan.badge ? 'shadow-xl shadow-orange-100' : 'shadow-sm'}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">{plan.badge}</span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-black text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-gray-900">{billingAnnual ? plan.annualPrice : plan.monthlyPrice}€</span>
                    <span className="text-gray-400 text-sm mb-1">/mes</span>
                  </div>
                  {billingAnnual && (
                    <p className="text-xs text-green-500 font-semibold mt-1">
                      Ahorras {(plan.monthlyPrice - plan.annualPrice) * 12}€ al año
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-300 mt-0.5 shrink-0">✕</span>
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3.5 rounded-2xl font-bold text-sm transition ${plan.ctaStyle}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl font-black text-gray-900">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                  <span className={`text-orange-500 text-lg transition-transform duration-200 shrink-0 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6 bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4">¿Listo para modernizar tu carta?</h2>
          <p className="text-orange-100 text-lg mb-10">
            Únete a los restaurantes que ya usan MenuAI para ofrecer una experiencia única a sus clientes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => document.querySelector('#precios')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white hover:bg-gray-50 text-orange-500 font-bold px-8 py-4 rounded-2xl transition text-lg shadow-lg"
            >
              Empezar gratis 14 días →
            </button>
            <button
              onClick={() => window.open('/r/la-taberna-del-puerto', '_blank')}
              className="border-2 border-white border-opacity-50 hover:border-opacity-100 text-white font-bold px-8 py-4 rounded-2xl transition text-lg"
            >
              📱 Ver demo
            </button>
          </div>
          <p className="text-orange-200 text-sm mt-6">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🍽️</span>
                <span className="text-xl font-black text-white">Menu<span className="text-orange-500">AI</span></span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">La carta digital inteligente para restaurantes. Adaptada a cada cliente, en 4 idiomas.</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Producto</h4>
                <ul className="space-y-2 text-sm">
                  {['Cómo funciona', 'Funcionalidades', 'Precios', 'Demo en vivo'].map((item, i) => (
                    <li key={i}>
                      <button
                        onClick={() => i === 3 ? window.open('/r/la-taberna-del-puerto', '_blank') : document.querySelector(['#como-funciona', '#funcionalidades', '#precios', ''][i])?.scrollIntoView({ behavior: 'smooth' })}
                        className="hover:text-orange-400 transition text-left"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
                <ul className="space-y-2 text-sm">
                  {['Privacidad', 'Términos de uso', 'Cookies', 'Contacto'].map((item, i) => (
                    <li key={i}>
                      <button className="hover:text-orange-400 transition">{item}</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs">© 2026 MenuAI. Todos los derechos reservados.</p>
            <p className="text-xs">Hecho con ❤️ en España · Cumple Reglamento UE 1169/2011</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

