'use client'

import { useState } from 'react'

type Allergen = {
  id: string
  name: string
  name_en: string
  icon: string
}

type Dish = {
  id: string
  name: string
  name_en: string
  description: string
  description_en: string
  price: number
  image_url: string | null
  is_available: boolean
  is_featured: boolean
  category_id: string
  dish_allergens: { allergens: Allergen }[]
}

type Category = {
  id: string
  name: string
  name_en: string
}

type Restaurant = {
  id: string
  name: string
  description: string
  logo_url: string | null
}

type Props = {
  data: {
    restaurant: Restaurant
    categories: Category[]
    dishes: Dish[]
  }
}

export default function MenuClient({ data }: Props) {
  const { restaurant, categories, dishes } = data
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [lang, setLang] = useState<'es' | 'en'>('es')

  const filteredDishes = activeCategory === 'all'
    ? dishes
    : dishes.filter(d => d.category_id === activeCategory)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-sm text-gray-500">{restaurant.description}</p>
          </div>
          {/* Selector de idioma */}
          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
          >
            {lang === 'es' ? '🇬🇧 EN' : '🇪🇸 ES'}
          </button>
        </div>

        {/* FILTRO DE CATEGORÍAS */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeCategory === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lang === 'es' ? 'Todo' : 'All'}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  activeCategory === cat.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lang === 'es' ? cat.name : (cat.name_en || cat.name)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PLATOS */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {filteredDishes.length === 0 && (
          <p className="text-center text-gray-400 py-12">
            {lang === 'es' ? 'No hay platos disponibles' : 'No dishes available'}
          </p>
        )}

        {filteredDishes.map(dish => (
          <div
            key={dish.id}
            className={`bg-white rounded-2xl shadow-sm overflow-hidden flex ${
              !dish.is_available ? 'opacity-60' : ''
            }`}
          >
            {/* INFO DEL PLATO */}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {/* Badge destacado */}
                  {dish.is_featured && (
                    <span className="inline-block bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full mb-1">
                      {lang === 'es' ? '⭐ Recomendado' : '⭐ Recommended'}
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900 text-base leading-tight">
                    {lang === 'es' ? dish.name : (dish.name_en || dish.name)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 leading-snug">
                    {lang === 'es'
                      ? dish.description
                      : (dish.description_en || dish.description)}
                  </p>
                </div>
              </div>

              {/* ALÉRGENOS */}
              {dish.dish_allergens.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {dish.dish_allergens.map(({ allergens: a }) => (
                    <span
                      key={a.id}
                      title={lang === 'es' ? a.name : a.name_en}
                      className="text-base cursor-help"
                    >
                      {a.icon}
                    </span>
                  ))}
                </div>
              )}

              {/* PRECIO Y DISPONIBILIDAD */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-orange-500">
                  {Number(dish.price).toFixed(2)} €
                </span>
                {!dish.is_available && (
                  <span className="text-xs bg-red-100 text-red-500 px-2 py-1 rounded-full font-medium">
                    {lang === 'es' ? 'Agotado' : 'Sold out'}
                  </span>
                )}
              </div>
            </div>

            {/* IMAGEN */}
            {dish.image_url ? (
              <img
                src={dish.image_url}
                alt={dish.name}
                className="w-28 h-28 object-cover self-center mr-3 rounded-xl"
              />
            ) : (
              <div className="w-28 h-28 bg-orange-50 self-center mr-3 rounded-xl flex items-center justify-center text-4xl">
                🍽️
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="text-center py-8 text-xs text-gray-400">
        <p>Powered by <span className="font-semibold text-orange-400">MenuAI</span></p>
      </div>
    </div>
  )
}