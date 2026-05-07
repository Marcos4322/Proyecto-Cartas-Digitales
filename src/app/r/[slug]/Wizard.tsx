'use client'

import { useState } from 'react'

type Allergen = {
  id: string
  name: string
  name_en: string
  icon: string
}

type Lang = 'es' | 'en' | 'de' | 'fr'

type WizardPreferences = {
  excludedAllergens: string[]
  diet: string | null
  foodTypes: string[]
}

type Props = {
  allergens: Allergen[]
  lang: Lang
  onComplete: (prefs: WizardPreferences) => void
  onSkip: () => void
}

const DIET_OPTIONS = [
  { key: 'all', icon: '🍽️', es: 'Sin restricciones', en: 'No restrictions', de: 'Keine Einschränkungen', fr: 'Sans restrictions' },
  { key: 'vegan', icon: '🌱', es: 'Vegano', en: 'Vegan', de: 'Vegan', fr: 'Vegan' },
  { key: 'vegetarian', icon: '🥦', es: 'Vegetariano', en: 'Vegetarian', de: 'Vegetarisch', fr: 'Vegetarien' },
  { key: 'gluten_free', icon: '🌾', es: 'Sin gluten', en: 'Gluten free', de: 'Glutenfrei', fr: 'Sans gluten' },
  { key: 'pescatarian', icon: '🐟', es: 'Solo pescado', en: 'Pescatarian', de: 'Nur Fisch', fr: 'Pescatarien' },
]

const FOOD_TYPES = [
  { key: 'starters', icon: '🥗', es: 'Entrantes', en: 'Starters', de: 'Vorspeisen', fr: 'Entrees' },
  { key: 'rice', icon: '🥘', es: 'Arroces', en: 'Rice dishes', de: 'Reisgerichte', fr: 'Plats de riz' },
  { key: 'fish', icon: '🐟', es: 'Pescados', en: 'Fish', de: 'Fisch', fr: 'Poisson' },
  { key: 'meat', icon: '🥩', es: 'Carnes', en: 'Meat', de: 'Fleisch', fr: 'Viandes' },
  { key: 'desserts', icon: '🍮', es: 'Postres', en: 'Desserts', de: 'Nachspeisen', fr: 'Desserts' },
  { key: 'drinks', icon: '🍷', es: 'Bebidas', en: 'Drinks', de: 'Getranke', fr: 'Boissons' },
]

const UI = {
  step1Title: { es: 'Tienes alguna alergia?', en: 'Any allergies?', de: 'Haben Sie Allergien?', fr: 'Des allergies?' },
  step1Sub: { es: 'Selecciona los alergenos que quieres evitar', en: 'Select allergens to avoid', de: 'Wählen Sie Allergene aus', fr: 'Selectionnez les allergenes' },
  step2Title: { es: 'Como comes?', en: 'Dietary preference?', de: 'Ernahrungsweise?', fr: 'Regime alimentaire?' },
  step2Sub: { es: 'Elige tu preferencia de dieta', en: 'Choose your dietary preference', de: 'Wählen Sie Ihre Ernahrungsweise', fr: 'Choisissez votre regime' },
  step3Title: { es: 'Que te apetece hoy?', en: 'What are you in the mood for?', de: 'Worauf haben Sie Lust?', fr: 'Qu est ce qui vous fait envie?' },
  step3Sub: { es: 'Elige uno o varios tipos de platos', en: 'Choose one or more dish types', de: 'Wählen Sie eine oder mehrere Optionen', fr: 'Choisissez un ou plusieurs types' },
  skip: { es: 'Saltar y ver carta', en: 'Skip and see menu', de: 'Uberspringen', fr: 'Passer' },
  next: { es: 'Siguiente', en: 'Next', de: 'Weiter', fr: 'Suivant' },
  back: { es: 'Atras', en: 'Back', de: 'Zuruck', fr: 'Retour' },
  finish: { es: 'Ver mis recomendaciones', en: 'See my recommendations', de: 'Empfehlungen anzeigen', fr: 'Voir mes recommandations' },
  none: { es: 'Ninguna alergia', en: 'No allergies', de: 'Keine Allergien', fr: 'Aucune allergie' },
}

function tr(key: keyof typeof UI, lang: Lang): string {
  return UI[key][lang] || UI[key]['es']
}

export default function Wizard({ allergens, lang, onComplete, onSkip }: Props) {
  const [step, setStep] = useState(1)
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([])
  const [diet, setDiet] = useState<string | null>(null)
  const [foodTypes, setFoodTypes] = useState<string[]>([])

  const toggleAllergen = (id: string) => {
    setExcludedAllergens(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const toggleFoodType = (key: string) => {
    setFoodTypes(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    )
  }

  const handleFinish = () => {
    onComplete({ excludedAllergens, diet, foodTypes })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Barra de progreso */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-orange-500 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-6">

          {/* Indicador de pasos */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1.5">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s === step ? 'w-6 bg-orange-500' : s < step ? 'w-2 bg-orange-300' : 'w-2 bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={onSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              {tr('skip', lang)}
            </button>
          </div>

          {/* PASO 1 — Alergenos */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {tr('step1Title', lang)}
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {tr('step1Sub', lang)}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {allergens.map(a => (
                  <button
                    key={a.id}
                    onClick={() => toggleAllergen(a.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition text-center ${
                      excludedAllergens.includes(a.id)
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <span className="text-xs font-medium text-gray-700 leading-tight">
                      {lang === 'es' ? a.name : a.name_en}
                    </span>
                    {excludedAllergens.includes(a.id) && (
                      <span className="text-xs text-red-500 font-bold">X</span>
                    )}
                  </button>
                ))}
              </div>
              {excludedAllergens.length === 0 && (
                <p className="text-center text-xs text-gray-400 mb-4">
                  {tr('none', lang)}
                </p>
              )}
              <button
                onClick={() => setStep(2)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition"
              >
                {tr('next', lang)}
              </button>
            </div>
          )}

          {/* PASO 2 — Dieta */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {tr('step2Title', lang)}
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {tr('step2Sub', lang)}
              </p>
              <div className="grid grid-cols-1 gap-2 mb-6">
                {DIET_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setDiet(opt.key === 'all' ? null : opt.key)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left ${
                      (opt.key === 'all' && diet === null) || diet === opt.key
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-medium text-gray-800">
                      {opt[lang] || opt.es}
                    </span>
                    {((opt.key === 'all' && diet === null) || diet === opt.key) && (
                      <span className="ml-auto text-orange-500 font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl transition"
                >
                  {tr('back', lang)}
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-[3] bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition"
                >
                  {tr('next', lang)}
                </button>
              </div>
            </div>
          )}

          {/* PASO 3 — Tipo de comida */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {tr('step3Title', lang)}
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {tr('step3Sub', lang)}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {FOOD_TYPES.map(ft => (
                  <button
                    key={ft.key}
                    onClick={() => toggleFoodType(ft.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition ${
                      foodTypes.includes(ft.key)
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-2xl">{ft.icon}</span>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                      {ft[lang] || ft.es}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl transition"
                >
                  {tr('back', lang)}
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-[3] bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition"
                >
                  {tr('finish', lang)}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}