'use client'

import { useEffect, useState, useRef } from 'react'

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
  is_featured: boolean
  is_vegan: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  is_pescatarian: boolean
  is_meat: boolean
  category_id: string
  image_url: string | null
}

type Category = {
  id: string
  name: string
}

const emptyDish = {
  name: '',
  description: '',
  price: '',
  is_available: true,
  is_featured: false,
  is_meat: false,
  is_vegan: false,
  is_vegetarian: false,
  is_gluten_free: false,
  is_pescatarian: false,
  category_id: '',
  image_url: null as string | null,
}

export default function AdminPage({ params }: { params: { slug: string } }) {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [restaurantId, setRestaurantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [form, setForm] = useState(emptyDish)
  const [uploading, setUploading] = useState(false)
  const [formSaving, setFormSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      const restRes = await fetch('/api/restaurants')
      const restaurants = await restRes.json()
      const restaurant = restaurants.find(
        (r: { slug: string; id: string }) => r.slug === params.slug
      )
      if (!restaurant) return
      setRestaurantId(restaurant.id)
      const [dishesRes, catsRes] = await Promise.all([
        fetch(`/api/dishes?restaurant_id=${restaurant.id}`),
        fetch(`/api/categories?restaurant_id=${restaurant.id}`)
      ])
      setDishes(await dishesRes.json())
      setCategories(await catsRes.json())
      setLoading(false)
    }
    fetchData()
  }, [params.slug])

  const toggleAvailable = async (dish: Dish) => {
    setSaving(dish.id)
    await fetch('/api/stock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dish_id: dish.id, is_available: !dish.is_available })
    })
    setDishes(prev =>
      prev.map(d => d.id === dish.id ? { ...d, is_available: !d.is_available } : d)
    )
    setSaving(null)
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Sin categoria'
  }

  const openCreate = () => {
    setEditingDish(null)
    setForm(emptyDish)
    setShowForm(true)
  }

  const openEdit = (dish: Dish) => {
    setEditingDish(dish)
    setForm({
      name: dish.name,
      description: dish.description || '',
      price: String(dish.price),
      is_available: dish.is_available,
      is_featured: dish.is_featured,
      is_meat: dish.is_meat,
      is_vegan: dish.is_vegan,
      is_vegetarian: dish.is_vegetarian,
      is_gluten_free: dish.is_gluten_free,
      is_pescatarian: dish.is_pescatarian,
      category_id: dish.category_id,
      image_url: dish.image_url,
    })
    setShowForm(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !restaurantId) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('restaurant_id', restaurantId)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) setForm(prev => ({ ...prev, image_url: data.url }))
    setUploading(false)
  }

  const handleTranslateAndSubmit = async () => {
    if (!form.name || !form.price || !form.category_id) {
      alert('Nombre, precio y categoria son obligatorios')
      return
    }
    setTranslating(true)

    const [nameTranslations, descTranslations] = await Promise.all([
      fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: form.name })
      }).then(r => r.json()),
      form.description
        ? fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: form.description })
          }).then(r => r.json())
        : Promise.resolve({ en: '', de: '', fr: '' })
    ])

    setTranslating(false)
    setFormSaving(true)

    const dishData = {
      name: form.name,
      name_en: nameTranslations.en,
      name_de: nameTranslations.de,
      name_fr: nameTranslations.fr,
      description: form.description,
      description_en: descTranslations.en,
      description_de: descTranslations.de,
      description_fr: descTranslations.fr,
      price: parseFloat(form.price as string),
      is_available: form.is_available,
      is_featured: form.is_featured,
      is_meat: form.is_meat,
      is_vegan: form.is_vegan,
      is_vegetarian: form.is_vegetarian,
      is_gluten_free: form.is_gluten_free,
      is_pescatarian: form.is_pescatarian,
      category_id: form.category_id,
      image_url: form.image_url,
    }

    if (editingDish) {
      const res = await fetch('/api/dishes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingDish.id, ...dishData })
      })
      const updated = await res.json()
      setDishes(prev => prev.map(d => d.id === editingDish.id ? updated : d))
    } else {
      const res = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurantId, ...dishData })
      })
      const created = await res.json()
      setDishes(prev => [...prev, created])
    }

    setFormSaving(false)
    setShowForm(false)
    setEditingDish(null)
    setForm(emptyDish)
  }

  const handleDelete = async (dishId: string) => {
    if (!confirm('Seguro que quieres eliminar este plato?')) return
    await fetch(`/api/dishes?id=${dishId}`, { method: 'DELETE' })
    setDishes(prev => prev.filter(d => d.id !== dishId))
  }

  const verCarta = () => window.open(`/r/${params.slug}`, '_blank')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl mb-2">🍽️</p>
          <p className="text-gray-400 text-sm">Cargando panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
<div className="bg-white shadow-sm border-b border-gray-100">
  <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
    <div>
      <h1 className="text-xl font-bold text-gray-900">Panel Admin</h1>
      <p className="text-sm text-gray-400 capitalize">
        {params.slug.replace(/-/g, ' ')}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={() => window.open(`/dashboard/${params.slug}`, '_blank')}
        className="text-sm text-purple-500 hover:text-purple-600 font-medium border border-purple-200 px-4 py-2 rounded-xl transition flex items-center gap-1.5"
      >
        📊 Analytics
      </button>
      <button
        onClick={verCarta}
        className="text-sm text-orange-500 hover:text-orange-600 font-medium border border-orange-200 px-4 py-2 rounded-xl transition"
      >
        Ver carta
      </button>
      <button
        onClick={openCreate}
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl transition text-sm"
      >
        + Nuevo plato
      </button>
    </div>
  </div>
</div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* FORMULARIO CREAR / EDITAR */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-orange-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingDish ? 'Editar plato' : 'Nuevo plato'}
              </h3>
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
                <span className="text-sm">🤖</span>
                <span className="text-xs text-orange-600 font-medium">
                  Traduccion automatica EN / DE / FR
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">

              {/* Imagen */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Imagen del plato
                </label>
                <div className="flex items-center gap-4">
                  {form.image_url ? (
                    <img
                      src={form.image_url}
                      alt="preview"
                      className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-3xl border border-gray-200">
                      🍽️
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition"
                    >
                      {uploading ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                    {form.image_url && (
                      <button
                        onClick={() => setForm(p => ({ ...p, image_url: null }))}
                        className="block mt-2 text-xs text-red-400 hover:text-red-600"
                      >
                        Eliminar imagen
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Nombre del plato (en español) *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                  placeholder="Ej: Croquetas de bacalao"
                />
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <span>🤖</span> Se traducira automaticamente a EN, DE y FR al guardar
                </p>
              </div>

              {/* Descripcion */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Descripcion (en español)
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 resize-none"
                  rows={3}
                  placeholder="Ej: Croquetas artesanales de bacalao con alioli de limon"
                />
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <span>🤖</span> Se traducira automaticamente a EN, DE y FR al guardar
                </p>
              </div>

              {/* Precio y Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                    Precio (euros) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                      placeholder="12.50"
                    />
                    <span className="absolute right-3 top-3 text-sm text-gray-400">€</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                    Categoria *
                  </label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white"
                  >
                    <option value="">Seleccionar categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Opciones */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
                  Caracteristicas del plato
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'is_available', label: '✅ Disponible', desc: 'El plato esta en carta' },
                    { key: 'is_featured', label: '⭐ Recomendado', desc: 'Aparece destacado' },
                    { key: 'is_meat', label: '🥩 Contiene carne', desc: 'Excluido para veganos' },
                    { key: 'is_vegan', label: '🌱 Vegano', desc: 'Apto para veganos' },
                    { key: 'is_vegetarian', label: '🥦 Vegetariano', desc: 'Sin carne ni pescado' },
                    { key: 'is_gluten_free', label: '🌾 Sin gluten', desc: 'Apto para celiaquía' },
                    { key: 'is_pescatarian', label: '🐟 Pescado', desc: 'Contiene pescado' },
                  ].map(opt => (
                    <label
                      key={opt.key}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                        form[opt.key as keyof typeof form]
                          ? 'border-orange-300 bg-orange-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form[opt.key as keyof typeof form] as boolean}
                        onChange={e => setForm(p => ({ ...p, [opt.key]: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 accent-orange-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={handleTranslateAndSubmit}
                  disabled={formSaving || translating}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {translating
                    ? <><span className="animate-spin">🌐</span> Traduciendo...</>
                    : formSaving
                    ? <><span className="animate-spin">💾</span> Guardando...</>
                    : editingDish
                    ? 'Guardar cambios'
                    : 'Crear plato'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditingDish(null); setForm(emptyDish) }}
                  className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TABLA DE PLATOS */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Platos ({dishes.length})
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plato</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dishes.map(dish => (
                <tr key={dish.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {dish.image_url ? (
                        <img
                          src={dish.image_url}
                          alt={dish.name}
                          className="w-12 h-12 object-cover rounded-xl shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                          🍽️
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{dish.name}</p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {dish.is_featured && <span className="text-xs text-orange-500">⭐</span>}
                          {dish.is_vegan && <span className="text-xs text-green-600">🌱</span>}
                          {dish.is_meat && <span className="text-xs text-red-400">🥩</span>}
                          {dish.is_gluten_free && <span className="text-xs text-yellow-600">🌾</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{getCategoryName(dish.category_id)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-orange-500 text-sm">
                      {Number(dish.price).toFixed(2)} €
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAvailable(dish)}
                        disabled={saving === dish.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          dish.is_available ? 'bg-green-500' : 'bg-gray-300'
                        } ${saving === dish.id ? 'opacity-50' : ''}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          dish.is_available ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                      <span className={`text-xs font-medium ${dish.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                        {dish.is_available ? 'Disponible' : 'Agotado'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(dish)}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(dish.id)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}