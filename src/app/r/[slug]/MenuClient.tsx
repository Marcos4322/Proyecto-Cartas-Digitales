'use client'

import { useState, useEffect } from 'react'
import Wizard from './Wizard'
import { SkeletonMenu } from './SkeletonCard'
import Chatbot from './Chatbot'
import { trackEvent } from '@/lib/analytics'

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
  is_meat: boolean
  likes: number
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

type WizardPreferences = {
  excludedAllergens: string[]
  diet: string | null
  foodTypes: string[]
}

type Props = {
  data: {
    restaurant: Restaurant
    categories: Category[]
    dishes: Dish[]
  }
}

type Lang = 'es' | 'en' | 'de' | 'fr'
type Tab = 'forYou' | 'menu'

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'de', label: 'DE', flag: '🇩🇪' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
]

const DIET_FILTERS = [
  { key: 'vegan',       es: '🌱 Vegano',      en: '🌱 Vegan',       de: '🌱 Vegan',       fr: '🌱 Vegan'        },
  { key: 'vegetarian',  es: '🥦 Vegetariano', en: '🥦 Vegetarian',  de: '🥦 Vegetarisch', fr: '🥦 Vegetarien'   },
  { key: 'gluten_free', es: '🌾 Sin gluten',  en: '🌾 Gluten free', de: '🌾 Glutenfrei',  fr: '🌾 Sans gluten'  },
  { key: 'pescatarian', es: '🐟 Pescado',     en: '🐟 Pescatarian', de: '🐟 Fisch',       fr: '🐟 Poisson'      },
]

const UI: Record<string, Record<Lang, string>> = {
  all:          { es: 'Todo',              en: 'All',              de: 'Alle',              fr: 'Tout'              },
  recommended:  { es: '⭐ Recomendado',   en: '⭐ Recommended',  de: '⭐ Empfohlen',     fr: '⭐ Recommande'    },
  soldout:      { es: '🚫 Agotado',       en: '🚫 Sold out',     de: '🚫 Ausverkauft',  fr: '🚫 Epuise'        },
  vegan:        { es: '🌱 Vegano',        en: '🌱 Vegan',        de: '🌱 Vegan',        fr: '🌱 Vegan'         },
  glutenfree:   { es: '🌾 Sin gluten',    en: '🌾 GF',           de: '🌾 GF',           fr: '🌾 SG'            },
  noResults:    { es: 'No hay platos con estos filtros', en: 'No dishes match your filters', de: 'Keine Gerichte', fr: 'Aucun plat' },
  clearFilters: { es: 'Limpiar filtros',  en: 'Clear filters',   de: 'Filter loschen',  fr: 'Effacer filtres'  },
  showAll:      { es: 'Ver todos',        en: 'Show all',        de: 'Alle zeigen',     fr: 'Tout afficher'    },
  allergens:    { es: '⚠️ Alergenos',    en: '⚠️ Allergens',   de: '⚠️ Allergene',   fr: '⚠️ Allergenes'   },
  exclude:      { es: 'Excluir alergenos:', en: 'Exclude allergens:', de: 'Allergene:', fr: 'Exclure:'         },
  dishes:       { es: 'platos',           en: 'dishes',          de: 'Gerichte',        fr: 'plats'            },
  powered:      { es: 'Carta digital por', en: 'Digital menu by', de: 'Digitale Karte von', fr: 'Menu par'     },
  tabForYou:    { es: '✨ Para ti',       en: '✨ For you',      de: '✨ Fur dich',     fr: '✨ Pour toi'      },
  tabMenu:      { es: '🍽️ Carta completa', en: '🍽️ Full menu', de: '🍽️ Speisekarte', fr: '🍽️ Carte complete' },
  forYouSub:    { es: 'Basado en tus preferencias', en: 'Based on your preferences', de: 'Basierend auf Ihren Vorlieben', fr: 'Selon vos preferences' },
  changePrefs:  { es: 'Cambiar preferencias', en: 'Change preferences', de: 'Andern', fr: 'Modifier'         },
  noForYou:     { es: 'No encontramos platos que coincidan con tus preferencias. Prueba a cambiarlas.', en: 'No dishes match your preferences. Try changing them.', de: 'Keine passenden Gerichte.', fr: 'Aucun plat correspondant.' },
  goToMenu:     { es: 'Ver carta completa', en: 'See full menu', de: 'Zur Speisekarte', fr: 'Voir la carte'   },
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

function filterByPreferences(dishes: Dish[], prefs: WizardPreferences): Dish[] {
  return dishes.filter(dish => {
    if (!dish.is_available) return false
    if (prefs.excludedAllergens.length > 0) {
      const ids = dish.dish_allergens.map(da => da.allergens.id)
      if (prefs.excludedAllergens.some(id => ids.includes(id))) return false
    }
    if (prefs.diet === 'vegan' && (!dish.is_vegan || dish.is_meat)) return false
    if (prefs.diet === 'vegetarian' && (!dish.is_vegetarian || dish.is_meat)) return false
    if (prefs.diet === 'gluten_free' && !dish.is_gluten_free) return false
    if (prefs.diet === 'pescatarian' && dish.is_meat) return false
    return true
  })
}

function DishCard({
  dish,
  lang,
  restaurantId,
}: {
  dish: Dish
  lang: Lang
  restaurantId: string
}) {
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(dish.likes || 0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const likedDishes = JSON.parse(localStorage.getItem('menuai_likes') || '[]')
    if (likedDishes.includes(dish.id)) setLiked(true)
  }, [dish.id])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            timer = setTimeout(() => {
              trackEvent(restaurantId, 'dish_view', { dish_name: dish.name })
              observer.disconnect()
            }, 1000)
          } else {
            if (timer) clearTimeout(timer)
          }
        })
      },
      { threshold: 0.5 }
    )
    const el = document.getElementById(`dish-${dish.id}`)
    if (el) observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [])

  const handleLike = async () => {
    const action = liked ? 'unlike' : 'like'

    // Animacion solo al dar like
    if (!liked) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 600)
    }

    // Actualizar estado local inmediatamente
    setLiked(!liked)
    setLikesCount(prev => liked ? Math.max(0, prev - 1) : prev + 1)

    // Actualizar localStorage
    const likedDishes = JSON.parse(localStorage.getItem('menuai_likes') || '[]')
    if (liked) {
      localStorage.setItem(
        'menuai_likes',
        JSON.stringify(likedDishes.filter((id: string) => id !== dish.id))
      )
    } else {
      localStorage.setItem(
        'menuai_likes',
        JSON.stringify([...likedDishes, dish.id])
      )
    }

    // Llamar a la API
    await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dish_id: dish.id,
        restaurant_id: restaurantId,
        action,
      }),
    })
  }

  return (
    <div
      id={`dish-${dish.id}`}
      className={`bg-white rounded-2xl shadow-sm overflow-hidden flex transition ${
        !dish.is_available ? 'opacity-50' : 'hover:shadow-md'
      }`}
    >
      <div className="flex-1 p-4">
        <div className="flex flex-wrap gap-1 mb-1.5">
          {dish.is_featured && (
            <span className="inline-block bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              {t('recommended', lang)}
            </span>
          )}
          {dish.is_vegan && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
              {t('vegan', lang)}
            </span>
          )}
          {dish.is_gluten_free && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">
              {t('glutenfree', lang)}
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 text-base leading-tight">
          {dishName(dish, lang)}
        </h3>
        <p className="text-sm text-gray-500 mt-1 leading-snug line-clamp-2">
          {dishDesc(dish, lang)}
        </p>

        {dish.dish_allergens.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-2">
            {dish.dish_allergens.map(({ allergens: a }) => (
              <span
                key={a.id}
                title={lang === 'es' ? a.name : a.name_en}
                className="text-sm cursor-help"
              >
                {a.icon}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-xl font-black text-orange-500">
            {Number(dish.price).toFixed(2)} €
          </span>

          <div className="flex items-center gap-2">
            {!dish.is_available && (
              <span className="text-xs bg-red-100 text-red-500 px-2.5 py-1 rounded-full font-semibold">
                {t('soldout', lang)}
              </span>
            )}

            {/* BOTON DE LIKE */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
                liked
                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                  : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400'
              }`}
            >
              <span
                className={`transition-transform duration-300 inline-block ${
                  animating ? 'scale-150' : 'scale-100'
                }`}
              >
                {liked ? '❤️' : '🤍'}
              </span>
              {likesCount > 0 ? (
                <span className={liked ? 'text-red-500' : 'text-gray-500'}>
                  {likesCount}
                </span>
              ) : (
                <span className="text-gray-300">
                  {lang === 'es' ? 'Me gusta' :
                   lang === 'en' ? 'Like' :
                   lang === 'de' ? 'Gefällt mir' : 'Jaime'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {dish.image_url ? (
        <img
          src={dish.image_url}
          alt={dish.name}
          className="w-28 h-28 object-cover self-center mr-3 rounded-xl shrink-0"
        />
      ) : (
        <div className="w-28 h-28 bg-orange-50 self-center mr-3 rounded-xl flex items-center justify-center text-4xl shrink-0 border border-orange-100">
          🍽️
        </div>
      )}
    </div>
  )
}

export default function MenuClient({ data }: Props) {
  const { restaurant, categories, dishes } = data
  const [lang, setLang] = useState<Lang>('es')
  const [activeTab, setActiveTab] = useState<Tab>('menu')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeDiet, setActiveDiet] = useState<string | null>(null)
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([])
  const [showAllergenFilter, setShowAllergenFilter] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [preferences, setPreferences] = useState<WizardPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Skeleton de carga
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Preferencias del wizard
  useEffect(() => {
    const saved = localStorage.getItem('menuai_preferences')
    if (saved) {
      const parsed = JSON.parse(saved)
      setPreferences(parsed)
      const hasPrefs =
        parsed.diet !== null ||
        parsed.excludedAllergens.length > 0 ||
        parsed.foodTypes.length > 0
      if (hasPrefs) setActiveTab('forYou')
      else setActiveTab('menu')
    } else {
      setTimeout(() => setShowWizard(true), 600)
    }
  }, [])

  // Tracking: escaneo QR al abrir la carta
  useEffect(() => {
    if (!isLoading && restaurant.id) {
      trackEvent(restaurant.id, 'qr_scan', { source: 'table_qr' })
    }
  }, [isLoading, restaurant.id])

  // Tracking: cambio de idioma
  useEffect(() => {
    if (!isLoading && restaurant.id && lang !== 'es') {
      trackEvent(restaurant.id, 'language_change', { lang })
    }
  }, [lang])

  // Tracking: filtro de dieta usado
  useEffect(() => {
    if (activeDiet && restaurant.id) {
      trackEvent(restaurant.id, 'filter_used', { filter_name: activeDiet })
    }
  }, [activeDiet])

  const handleWizardComplete = (prefs: WizardPreferences) => {
    setPreferences(prefs)
    localStorage.setItem('menuai_preferences', JSON.stringify(prefs))
    setShowWizard(false)
    const hasPrefs =
      prefs.diet !== null ||
      prefs.excludedAllergens.length > 0 ||
      prefs.foodTypes.length > 0
    if (hasPrefs) setActiveTab('forYou')
    else setActiveTab('menu')
  }

  const handleWizardSkip = () => {
    const empty = { excludedAllergens: [], diet: null, foodTypes: [] }
    localStorage.setItem('menuai_preferences', JSON.stringify(empty))
    setPreferences(empty)
    setShowWizard(false)
    setActiveTab('menu')
  }

  const resetPreferences = () => {
    localStorage.removeItem('menuai_preferences')
    setPreferences(null)
    setActiveTab('menu')
    setShowWizard(true)
  }

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

  const hasPreferences =
    preferences &&
    (preferences.diet !== null ||
      preferences.excludedAllergens.length > 0 ||
      preferences.foodTypes.length > 0)

  const forYouDishes = preferences ? filterByPreferences(dishes, preferences) : []

  const filteredDishes = dishes.filter(dish => {
    if (activeCategory !== 'all' && dish.category_id !== activeCategory) return false
    if (activeDiet === 'vegan' && (!dish.is_vegan || dish.is_meat)) return false
    if (activeDiet === 'vegetarian' && (!dish.is_vegetarian || dish.is_meat)) return false
    if (activeDiet === 'gluten_free' && !dish.is_gluten_free) return false
    if (activeDiet === 'pescatarian' && dish.is_meat) return false
    if (excludedAllergens.length > 0) {
      const ids = dish.dish_allergens.map(da => da.allergens.id)
      if (excludedAllergens.some(id => ids.includes(id))) return false
    }
    return true
  })

  const currentLang = LANGS.find(l => l.code === lang)!

  return (
    <div className="min-h-screen bg-gray-50">

      {showWizard && (
        <Wizard
          allergens={allAllergens}
          lang={lang}
          onComplete={handleWizardComplete}
          onSkip={handleWizardSkip}
        />
      )}

      {/* HEADER */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-xs text-gray-400">{restaurant.description}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              {currentLang.flag} {currentLang.label} ▾
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30 min-w-28">
                {LANGS.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLangMenu(false) }}
                    className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition ${
                      lang === l.code ? 'font-bold text-orange-500 bg-orange-50' : 'text-gray-700'
                    }`}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PESTAÑAS */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex border-b border-gray-100">
            {hasPreferences && (
              <button
                onClick={() => setActiveTab('forYou')}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${
                  activeTab === 'forYou'
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {t('tabForYou', lang)}
              </button>
            )}
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${
                activeTab === 'menu'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t('tabMenu', lang)}
            </button>
          </div>
        </div>

        {/* FILTROS — solo en pestaña carta */}
        {activeTab === 'menu' && (
          <div className="border-t border-gray-50">
            <div className="max-w-2xl mx-auto px-4 pt-2 pb-1">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    activeCategory === 'all'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('all', lang)}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                      activeCategory === cat.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {categoryName(cat, lang)}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-w-2xl mx-auto px-4 pb-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {DIET_FILTERS.map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveDiet(activeDiet === filter.key ? null : filter.key)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition border ${
                      activeDiet === filter.key
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                    }`}
                  >
                    {filter[lang]}
                  </button>
                ))}
                <button
                  onClick={() => setShowAllergenFilter(!showAllergenFilter)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition border ${
                    excludedAllergens.length > 0
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                  }`}
                >
                  {t('allergens', lang)}
                  {excludedAllergens.length > 0 && ` (${excludedAllergens.length})`}
                </button>
              </div>
              {showAllergenFilter && (
                <div className="mt-2 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 mb-2">{t('exclude', lang)}</p>
                  <div className="flex flex-wrap gap-2">
                    {allAllergens.map(a => (
                      <button
                        key={a.id}
                        onClick={() => toggleAllergen(a.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition border ${
                          excludedAllergens.includes(a.id)
                            ? 'bg-red-100 border-red-300 text-red-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-red-200'
                        }`}
                      >
                        {a.icon} {lang === 'es' ? a.name : a.name_en}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SKELETON mientras carga */}
      {isLoading ? (
        <SkeletonMenu />
      ) : (
        <>
          {/* PESTAÑA: PARA TI */}
          {activeTab === 'forYou' && hasPreferences && (
            <div className="max-w-2xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">{t('forYouSub', lang)}</p>
                <button
                  onClick={resetPreferences}
                  className="text-xs text-orange-500 hover:text-orange-700 font-semibold border border-orange-200 bg-white px-3 py-1.5 rounded-full transition"
                >
                  {t('changePrefs', lang)}
                </button>
              </div>

              {forYouDishes.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {forYouDishes.map(dish => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        lang={lang}
                        restaurantId={restaurant.id}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="w-full mt-6 py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-semibold text-gray-400 hover:border-orange-300 hover:text-orange-400 transition"
                  >
                    {t('goToMenu', lang)} →
                  </button>
                </>
              ) : (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                  <p className="text-5xl mb-4">🔍</p>
                  <p className="text-gray-500 font-medium mb-2">{t('noForYou', lang)}</p>
                  <div className="flex gap-3 justify-center mt-5">
                    <button
                      onClick={resetPreferences}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
                    >
                      {t('changePrefs', lang)}
                    </button>
                    <button
                      onClick={() => setActiveTab('menu')}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl transition text-sm"
                    >
                      {t('goToMenu', lang)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA: CARTA COMPLETA */}
          {activeTab === 'menu' && (
            <div className="max-w-2xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400 font-medium">
                  {filteredDishes.length} {t('dishes', lang)}
                </p>
                {(activeDiet || excludedAllergens.length > 0) && (
                  <button
                    onClick={() => {
                      setActiveDiet(null)
                      setExcludedAllergens([])
                      setShowAllergenFilter(false)
                    }}
                    className="text-xs text-orange-400 hover:text-orange-600 font-semibold underline"
                  >
                    {t('clearFilters', lang)}
                  </button>
                )}
              </div>

              {filteredDishes.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-5xl mb-4">🔍</p>
                  <p className="text-gray-400 font-medium mb-4">{t('noResults', lang)}</p>
                  <button
                    onClick={() => {
                      setActiveDiet(null)
                      setExcludedAllergens([])
                      setActiveCategory('all')
                      setShowAllergenFilter(false)
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm"
                  >
                    {t('showAll', lang)}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDishes.map(dish => (
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      lang={lang}
                      restaurantId={restaurant.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CHATBOT */}
      {!isLoading && (
        <Chatbot
          lang={lang}
          restaurantName={restaurant.name}
          dishes={dishes}
        />
      )}

      <div className="text-center py-10 text-xs text-gray-300">
        <p>
          {t('powered', lang)}{' '}
          <span className="font-bold text-orange-300">MenuAI</span>
        </p>
      </div>
    </div>
  )
}