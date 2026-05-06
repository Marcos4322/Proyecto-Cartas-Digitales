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
  name_de: string
  name_fr: string
  description: string
  description_en: string
  description_de: string
  description_fr: string
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
  name_de: string
  name_fr: string
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

type Lang = 'es' | 'en' | 'de' | 'fr'

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'de', label: 'DE', flag: '🇩🇪' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
]

const DIET_FILTERS = [
  { key: 'vegan',       es: '🌱 Vegano',        en: '🌱 Vegan',        de: '🌱 Vegan',        fr: '🌱 Vegan'        },
  { key: 'vegetarian', es: '🥦 Vegetariano',    en: '🥦 Vegetarian',   de: '🥦 Vegetarisch',  fr: '🥦 Vegetarien'   },
  { key: 'gluten_free',es: '🌾 Sin gluten',     en: '🌾 Gluten free',  de: '🌾 Glutenfrei',   fr: '🌾 Sans gluten'  },
  { key: 'pescatarian',es: '🐟 Pescado',        en: '🐟 Pescatarian',  de: '🐟 Fisch',        fr: '🐟 Poisson'      },
]

const UI: Record<string, Record<Lang, string>> = {
  all:            { es: 'Todo',             en: 'All',            de: 'Alle',           fr: 'Tout'            },
  recommended:    { es: '⭐ Recomendado',   en: '⭐ Recommended', de: '⭐ Empfohlen',   fr: '⭐ Recommande'   },
  soldout:        { es: '🚫 Agotado',       en: '🚫 Sold out',    de: '🚫 Ausverkauft', fr: '🚫 Epuise'       },
  vegan:          { es: '🌱 Vegano',        en: '🌱 Vegan',       de: '🌱 Vegan',       fr: '🌱 Vegan'        },
  glutenfree:     { es: '🌾 Sin gluten',    en: '🌾 GF',          de: '🌾 GF',          fr: '🌾 SG'           },
  noResults:      { es: 'No hay platos con estos filtros', en: 'No dishes match your filters', de: 'Keine Gerichte mit diesen Filtern', fr: 'Aucun plat avec ces filtres' },
  clearFilters:   { es: 'Limpiar filtros',  en: 'Clear filters',  de: 'Filter loschen', fr: 'Effacer filtres' },
  showAll:        { es: 'Ver todos los platos', en: 'Show all dishes', de: 'Alle zeigen', fr: 'Tout afficher' },
  allergens:      { es: '⚠️ Alergenos',    en: '⚠️ Allergens',   de: '⚠️ Allergene',  fr: '⚠️ Allergenes'  },
  exclude:        { es: 'Excluir alergenos:', en: 'Exclude allergens:', de: 'Allergene ausschliessen:', fr: 'Exclure allergenes:' },
  dishes:         { es: 'platos',           en: 'dishes',         de: 'Gerichte',       fr: 'plats'           },
  powered:        { es: 'Carta digital por', en: 'Digital menu by', de: 'Digitale Karte von', fr: 'Menu numerique par' },
}

function t(key: string, lang: Lang): string {
  return UI[key]?.[lang] || UI[key]?.['es'] || key
}

function dishName(dish: Dish, lang: Lang): string {
  if (lang === 'es') return dish.name
  if (lang === 'de') return dish.name_de || dish.name_en || dish.name
  if (lang === 'fr') return dish.name_fr || dish.name_en || dish.name
  return dish.name_en || dish.name
}

function dishDesc(dish: Dish, lang: Lang): string {
  if (lang === 'es') return dish.description
  if (lang === 'de') return dish.description_de || dish.description_en || dish.description
  if (lang === 'fr') return dish.description_fr || dish.description_en || dish.description
  return dish.description_en || dish.description
}

function categoryName(cat: Category, lang: Lang): string {
  if (lang === 'es') return cat.name
  if (lang === 'de') return cat.name_de || cat.name_en || cat.name
  if (lang === 'fr') return cat.name_fr || cat.name_en || cat.name
  return cat.name_en || cat.name
}

export default function MenuClient({ data }: Props) {
  const { restaurant, categories, dishes } = data
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [lang, setLang] = useState<Lang>('es')
  const [activeDiet, setActiveDiet] = useState<string | null>(null)
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([])
  const [showAllergenFilter, setShowAllergenFilter] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  const allAllergens: Allergen[] = []
  dishes.forEach(dish => {
    dish.dish_allergens.forEach(({ allergens: a }) => {
      if (!allAllergens.find(al => al.id === a.id)) allAllergens.push(a)
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
      const ids = dish.dish_allergens.map(da => da.allergens.id)
      if (excludedAllergens.some(id => ids.includes(id))) return false
    }
    return true
  })

  const currentLang = LANGS.find(l => l.code === lang)!

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
              className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              {currentLang.flag} {currentLang.label} ▾
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 min-w-24">
                {LANGS.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLangMenu(false) }}
                    className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition ${lang === l.code ? 'font-bold text-orange-500 bg-orange-50' : 'text-gray-700'}`}
                  >
                    {l.flag} {l.label}
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
              {t('all', lang)}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {categoryName(cat, lang)}
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
                {filter[lang]}
              </button>
            ))}
            <button
              onClick={() => setShowAllergenFilter(!showAllergenFilter)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition border ${excludedAllergens.length > 0 ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}
            >
              {t('allergens', lang)}
              {excludedAllergens.length > 0 && ` (${excludedAllergens.length})`}
            </button>
          </div>

          {showAllergenFilter && (
            <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-2">{t('exclude', lang)}</p>
              <div className="flex flex-wrap gap-2">
                {allAllergens.map(a => (
                  <button
                    key={a.id}
                    onClick={() => toggleAllergen(a.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition border ${excludedAllergens.includes(a.id) ? 'bg-red-100 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-red-200'}`}
                  >
                    {a.icon} {lang === 'es' ? a.name : a.name_en}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTADOR */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <p className="text-xs text-gray-400">
          {filteredDishes.length} {t('dishes', lang)}
          {(activeDiet || excludedAllergens.length > 0) && (
            <button
              onClick={() => { setActiveDiet(null); setExcludedAllergens([]) }}
              className="ml-2 text-orange-400 hover:text-orange-600 underline"
            >
              {t('clearFilters', lang)}
            </button>
          )}
        </p>
      </div>

      {/* PLATOS */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {filteredDishes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-400 font-medium">{t('noResults', lang)}</p>
            <button
              onClick={() => { setActiveDiet(null); setExcludedAllergens([]); setActiveCategory('all') }}
              className="mt-3 text-orange-400 text-sm underline"
            >
              {t('showAll', lang)}
            </button>
          </div>
        )}

        {filteredDishes.map(dish => (
          <div
            key={dish.id}
            className={`bg-white rounded-2xl shadow-sm overflow-hidden flex ${!dish.is_available ? 'opacity-60' : ''}`}
          >
            <div className="flex-1 p-4">
              <div className="flex flex-wrap gap-1 mb-1">
                {dish.is_featured && (
                  <span className="inline-block bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {t('recommended', lang)}
                  </span>
                )}
                {dish.is_vegan && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                    {t('vegan', lang)}
                  </span>
                )}
                {dish.is_gluten_free && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                    {t('glutenfree', lang)}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 text-base leading-tight">
                {dishName(dish, lang)}
              </h3>
              <p className="text-sm text-gray-500 mt-1 leading-snug">
                {dishDesc(dish, lang)}
              </p>

              {dish.dish_allergens.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {dish.dish_allergens.map(({ allergens: a }) => (
                    <span key={a.id} title={lang === 'es' ? a.name : a.name_en} className="text-base cursor-help">
                      {a.icon}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-orange-500">
                  {Number(dish.price).toFixed(2)} €
                </span>
                {!dish.is_available && (
                  <span className="text-xs bg-red-100 text-red-500 px-2 py-1 rounded-full font-medium">
                    {t('soldout', lang)}
                  </span>
                )}
              </div>
            </div>

            {dish.image_url ? (
              <img
                src={dish.image_url}
                alt={dish.name}
                className="w-28 h-28 object-cover self-center mr-3 rounded-xl shrink-0"
              />
            ) : (
              <div className="w-28 h-28 bg-orange-50 self-center mr-3 rounded-xl flex items-center justify-center text-4xl shrink-0">
                🍽️
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center py-8 text-xs text-gray-400">
        <p>{t('powered', lang)} <span className="font-semibold text-orange-400">MenuAI</span></p>
      </div>
    </div>
  )
}