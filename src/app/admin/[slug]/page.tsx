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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Cargando panel...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Panel Admin</h1>
            <p className="text-sm text-gray-400 capitalize">
              {params.slug.replace(/-/g, ' ')}
            </p>
          </div>
          <button onClick={verCarta} className="text-sm text-orange-500 hover:underline">
            Ver carta
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Platos ({dishes.length})
          </h2>
          <button
            onClick={openCreate}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-xl transition"
          >
            + Nuevo plato
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-orange-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingDish ? 'Editar plato' : 'Nuevo plato'}
              </h3>
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
                <span className="text-sm">🤖</span>
                <span className="text-xs text-orange-600 font-medium">
                  Traduccion automatica EN / DE / FR
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                  Imagen
                </label>
                <div className="flex items-center gap-4">
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt="preview"
                      className="w-20 h-20 object-cover rounded-xl border border-gray-100"
                    />
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
                      className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
                    >
                      {uploading ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  placeholder="Ej: Croquetas de bacalao"
                />
                <p className="text-xs text-gray-400 mt-1">
                  🤖 Se traducira automaticamente a EN, DE y FR al guardar
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                  Descripcion
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  rows={2}
                  placeholder="Ej: Croquetas artesanales de bacalao con alioli de limon"
                />
                <p className="text-xs text-gray-400 mt-1">
                  🤖 Se traducira automaticamente a EN, DE y FR al guardar
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                    Precio (euros) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="12.50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                    Categoria *
                  </label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  >
                    <option value="">Seleccionar categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                  Opciones
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'is_available', label: 'Disponible' },
                    { key: 'is_featured', label: 'Recomendado' },
                    { key: 'is_vegan', label: '🌱 Vegano' },
                    { key: 'is_vegetarian', label: '🥦 Vegetariano' },
                    { key: 'is_gluten_free', label: '🌾 Sin gluten' },
                    { key: 'is_pescatarian', label: '🐟 Pescado' },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form[opt.key as keyof typeof form] as boolean}
                        onChange={e => setForm(p => ({ ...p, [opt.key]: e.target.checked }))}
                        className="w-4 h-4 accent-orange-500"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleTranslateAndSubmit}
                  disabled={formSaving || translating}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-xl transition disabled:opacity-50 flex items-center gap-2"
                >
                  {translating ? '🌐 Traduciendo...' : formSaving ? '💾 Guardando...' : editingDish ? 'Guardar cambios' : 'Crear plato'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditingDish(null); setForm(emptyDish) }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2 rounded-xl transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Plato</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dishes.map(dish => (
                <tr key={dish.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {dish.image_url ? (
                        <img src={dish.image_url} alt={dish.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-lg shrink-0">🍽️</div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{dish.name}</p>
                        {dish.is_featured && <span className="text-xs text-orange-500">⭐ Recomendado</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{getCategoryName(dish.category_id)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-orange-500">{Number(dish.price).toFixed(2)} €</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAvailable(dish)}
                        disabled={saving === dish.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dish.is_available ? 'bg-green-500' : 'bg-gray-300'} ${saving === dish.id ? 'opacity-50' : ''}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dish.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-xs text-gray-500">
                        {dish.is_available ? 'Disponible' : 'Agotado'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(dish)}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-3 py-1.5 rounded-lg transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(dish.id)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 py-1.5 rounded-lg transition"
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