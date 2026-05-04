'use client'

import { useEffect, useState } from 'react'

type Dish = {
  id: string
  name: string
  price: number
  is_available: boolean
  is_featured: boolean
  category_id: string
}

type Category = {
  id: string
  name: string
}

export default function AdminPage({ params }: { params: { slug: string } }) {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const restRes = await fetch('/api/restaurants')
      const restaurants = await restRes.json()
      const restaurant = restaurants.find(
        (r: { slug: string; id: string }) => r.slug === params.slug
      )
      if (!restaurant) return
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

  const verCarta = () => {
    window.open(`/r/${params.slug}`, '_blank')
  }

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
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Panel Admin</h1>
            <p className="text-sm text-gray-400 capitalize">
              {params.slug.replace(/-/g, ' ')}
            </p>
          </div>
          <button
            onClick={verCarta}
            className="text-sm text-orange-500 hover:underline"
          >
            Ver carta
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Gestion de platos ({dishes.length})
        </h2>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Plato</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dishes.map(dish => (
                <tr key={dish.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{dish.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {getCategoryName(dish.category_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-orange-500">
                      {Number(dish.price).toFixed(2)} euros
                    </span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}