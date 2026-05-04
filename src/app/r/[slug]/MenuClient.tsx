'use client'

import { useState, useEffect } from 'react'

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
  is_vegan: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  is_pescatarian: boolean
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

const DIET_FILTERS = [
  { key: 'vegan', label: { es: '🌱 Vegano', en: '🌱 Vegan' } },
  { key: 'vegetarian', label: { es: '🥦 Vegetariano', en: '🥦 Vegetarian' } },
  { key: 'gluten_free', label: { es: '🌾 Sin gluten', en: '🌾 Gluten free' } },
  { key: 'pescatarian', label: { es: '🐟 Pescado', en: '🐟 Pescatarian' } },
]

const LANGS = ['es', 'en', 'de', 'fr'] as const
type Lang = typeof LANGS[number]

const LANG_LABELS: Record<Lang, string> = {
  es: '🇪🇸 ES',
  en: '🇬🇧 EN',
  de: '🇩🇪 DE',
  fr: '🇫🇷 FR',
}

export default function MenuClient({ data }: Props) {
  const { restaurant, categories, dishes } = data
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [lang, setLang] = useState<Lang>('es')
  const [activeDiet, setActiveDiet] = useState<string | null>(null)
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([])
  const [showAllergenFilter, setShowAllergenFilter] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  // Obtener todos los alérgenos únicos del menú
  const allAllergens: Allergen[] = []
  dishes.forEach(dish => {
    dish.dish_allergens.forEach(({ allergens: a }) => {
      if (!allAllergens.find(al => al.id === a.id)) {
        allAllergens.push(a)
      }
    })
  })

  const toggleAllergen = (id: string) => {
    setExcludedAllergens(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const filteredDishes = dishes.filter(dish => {
    if (activeCategory !== 'all' && dish.category_id !== activeCategory) return false
    if (activeDiet === 'vegan' && !dish.is_vegan) return false
    if (activeDiet === 'vegetarian' && !dish.is_vegetarian) return false
    if (activeDiet === 'gluten_free' && !dish.is_gluten_free) return false
    if (activeDiet === 'pescatarian' && !dish.is_pescatarian) return false
    if (excludedAllergens.length > 0) {
      const dishAllergenIds = dish.dish_allergens.map(da => da.allergens.id)
      if (excludedAllergens.some(id => dishAllergenIds.includes(id))) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{restaurant.description}</p>
          </div>

          {/* Selector idioma */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              {LANG_LABELS[lang]}
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30">
                {LANGS.map(l => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setShowLangMenu(false) }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${lang === l ? 'font-bold text-orange-500' : 'text-gray-700'}`}
                  >
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FILTROS CATEGORÍA */}
        <div className="max-w-2xl mx-auto px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {lang === 'es' ? 'Todo' : lang === 'en' ? 'All' : lang === 'de' ? 'Alle' : 'Tout'}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {lang === 'es' ? cat.name : (cat.name_en || cat.name)}
              </button>
            ))}
          </div>
        </div>

        {/* FILTROS DIETA Y ALÉRGENOS */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DIET_FILTERS.map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveDiet(activeDiet === filter.key ? null : filter.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition border ${activeDiet === filter.key ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}
              >
                {filter.label[lang === 'en' ? 'en' : 'es']}
              </button>
            ))}

            {/* Botón filtro alérgenos */}
            <button
              onClick={() => setShowAllergenFilter(!showAllergenFilter)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition border ${excludedAllergens.length > 0 ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}
            >
              ⚠️ {lang === 'es' ? 'Alérgenos' : 'Allergens'}
              {excludedAllergens.length > 0 && ` (${excludedAllergens.length})`}
            </button>
          </div>

          {/* Panel de alérgenos */}
          {showAllergenFilter && (
            <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                {lang === 'es' ? 'Excluir alérgenos:' : 'Exclude allergens:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {allAllergens.map(a => (
                  <button
                    key={a.id}
                    onClick={() => toggleAllergen(a.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition border ${excludedAllergens.includes(a.id) ? 'bg-red-100 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-red-200'}`}
                  >
                    {a.icon} {lang === 'es' ? a.name : (a.name_en || a.name)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTADOR DE RESULTADOS */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <p className="text-xs text-gray-400">
          {filteredDishes.length} {lang === 'es' ? 'platos' : 'dishes'}
          {(activeDiet || excludedAllergens.length > 0) && (
            <button
              onClick={() => { setActiveDiet(null); setExcludedAllergens([]) }}
              className="ml-2 text-orange-400 hover:text-orange-600 underline"
            >
              {lang === 'es' ? 'Limpiar filtros' : 'Clear filters'}
            </button>
          )}
        </p>
      </div>

      {/* PLATOS */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {filteredDishes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-400 font-medium">
              {lang === 'es' ? 'No hay platos con estos filtros' : 'No dishes match your filters'}
            </p>
            <button
              onClick={() => { setActiveDiet(null); setExcludedAllergens([]); setActiveCategory('all') }}
              className="mt-3 text-orange-400 text-sm underline"
            >
              {lang === 'es' ? 'Ver todos los platos' : 'Show all dishes'}
            </button>
          </div>
        )}

        {filteredDishes.map(dish => (
          <div
            key={dish.id}
            className={`bg-white rounded-2xl shadow-sm overflow-hidden flex ${!dish.is_available ? 'opacity-60' : ''}`}
          >
            <div className="flex-1 p-4">
              <div className="flex-1">
                {dish.is_featured && (
                  <span className="inline-block bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full mb-1">
                    ⭐ {lang === 'es' ? 'Recomendado' : 'Recommended'}
                  </span>
                )}

                {/* Badges dieta */}
                <div className="flex gap-1 flex-wrap mb-1">
                  {dish.is_vegan && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">🌱 {lang === 'es' ? 'Vegano' : 'Vegan'}</span>}
                  {dish.is_gluten_free && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">🌾 {lang === 'es' ? 'Sin gluten' : 'GF'}</span>}
                </div>

                <h3 className="font-semibold text-gray-900 text-base leading-tight">
                  {lang === 'es' ? dish.name : (dish.name_en || dish.name)}
                </h3>
                <p className="text-sm text-gray-500 mt-1 leading-snug">
                  {lang === 'es' ? dish.description : (dish.description_en || dish.description)}
                </p>
              </div>

              {/* Alérgenos */}
              {dish.dish_allergens.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {dish.dish_allergens.map(({ allergens: a }) => (
                    <span key={a.id} title={lang === 'es' ? a.name : a.name_en} className="text-base cursor-help">
                      {a.icon}
                    </span>
                  ))}
                </div>
              )}

              {/* Precio y stock */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-orange-500">
                  {Number(dish.price).toFixed(2)} €
                </span>
                {!dish.is_available && (
                  <span className="text-xs bg-red-100 text-red-500 px-2 py-1 rounded-full font-medium">
                    {lang === 'es' ? '🚫 Agotado' : '🚫 Sold out'}
                  </span>
                )}
              </div>
            </div>

            {/* Imagen */}
            {dish.image_url ? (
              <img src={dish.image_url} alt={dish.name} className="w-28 h-28 object-cover self-center mr-3 rounded-xl" />
            ) : (
              <div className="w-28 h-28 bg-orange-50 self-center mr-3 rounded-xl flex items-center justify-center text-4xl shrink-0">
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