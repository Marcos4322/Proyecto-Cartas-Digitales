'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

type AnalyticsData = {
  period_days: number
  totals: {
    qr_scans: number
    dish_views: number
    filters_used: number
    lang_changes: number
    likes: number
  }
  top_dishes: { name: string; count: number }[]
  top_filters: { name: string; count: number }[]
  top_langs: { lang: string; count: number }[]
  scans_per_day: { date: string; count: number }[]
  dish_likes: { name: string; likes: number }[]
}

const FILTER_LABELS: Record<string, string> = {
  vegan: '🌱 Vegano',
  vegetarian: '🥦 Vegetariano',
  gluten_free: '🌾 Sin gluten',
  pescatarian: '🐟 Pescado',
  allergen_gluten: '⚠️ Alerg. Gluten',
  allergen_lacteos: '⚠️ Alerg. Lacteos',
}

const LANG_LABELS: Record<string, string> = {
  en: '🇬🇧 Ingles',
  de: '🇩🇪 Aleman',
  fr: '🇫🇷 Frances',
  es: '🇪🇸 Espanol',
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string
  label: string
  value: number
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>
          30 dias
        </span>
      </div>
      <p className="text-3xl font-black text-gray-900 mb-1">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

export default function DashboardPage({
  params,
}: {
  params: { slug: string }
}) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [restaurantId, setRestaurantId] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    const fetchRestaurant = async () => {
      const res = await fetch('/api/restaurants')
      const restaurants = await res.json()
      const restaurant = restaurants.find(
        (r: { slug: string; id: string; name: string }) => r.slug === params.slug
      )
      if (restaurant) {
        setRestaurantId(restaurant.id)
        setRestaurantName(restaurant.name)
      }
    }
    fetchRestaurant()
  }, [params.slug])

  useEffect(() => {
    if (!restaurantId) return
    const fetchAnalytics = async () => {
      setLoading(true)
      const res = await fetch(
        `/api/analytics?restaurant_id=${restaurantId}&days=${period}`
      )
      const json = await res.json()
      setData(json)
      setLoading(false)
    }
    fetchAnalytics()
  }, [restaurantId, period])

  const verCarta = () => window.open(`/r/${params.slug}`, '_blank')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">📊</div>
          <p className="text-gray-400 text-sm">Cargando analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const scansLineData = {
    labels: data.scans_per_day.map(d => {
      const date = new Date(d.date)
      return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Escaneos QR',
        data: data.scans_per_day.map(d => d.count),
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#F97316',
        pointRadius: 4,
      },
    ],
  }

  const dishesBarData = {
    labels: data.top_dishes.map(d =>
      d.name.length > 18 ? d.name.substring(0, 18) + '...' : d.name
    ),
    datasets: [
      {
        label: 'Vistas',
        data: data.top_dishes.map(d => d.count),
        backgroundColor: [
          'rgba(249, 115, 22, 0.85)',
          'rgba(249, 115, 22, 0.75)',
          'rgba(249, 115, 22, 0.65)',
          'rgba(249, 115, 22, 0.55)',
          'rgba(249, 115, 22, 0.45)',
          'rgba(249, 115, 22, 0.40)',
          'rgba(249, 115, 22, 0.35)',
          'rgba(249, 115, 22, 0.30)',
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const langsDoughnutData = {
    labels: data.top_langs.map(l => LANG_LABELS[l.lang] || l.lang),
    datasets: [
      {
        data: data.top_langs.map(l => l.count),
        backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F97316'],
        borderWidth: 0,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
    },
  }

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 11 }, stepSize: 1 },
        min: 0,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard Analytics</h1>
            <p className="text-sm text-gray-400 capitalize">{restaurantName}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={e => setPeriod(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-orange-400 bg-white"
            >
              <option value={7}>Ultimos 7 dias</option>
              <option value={30}>Ultimos 30 dias</option>
              <option value={90}>Ultimos 90 dias</option>
            </select>
            <button
              onClick={verCarta}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium border border-orange-200 px-4 py-2 rounded-xl transition"
            >
              Ver carta
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* TARJETAS DE METRICAS — ahora 5 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon="📱"
            label="Escaneos QR"
            value={data.totals.qr_scans}
            color="bg-orange-100 text-orange-600"
          />
          <StatCard
            icon="👁️"
            label="Vistas de platos"
            value={data.totals.dish_views}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon="🔍"
            label="Filtros usados"
            value={data.totals.filters_used}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            icon="🌍"
            label="Cambios de idioma"
            value={data.totals.lang_changes}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            icon="❤️"
            label="Me gusta"
            value={data.totals.likes}
            color="bg-red-100 text-red-500"
          />
        </div>

        {/* GRAFICO: ESCANEOS POR DIA */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Escaneos QR por dia</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ultimos 7 dias</p>
            </div>
            <span className="text-2xl">📱</span>
          </div>
          <Line data={scansLineData} options={lineOptions} height={80} />
        </div>

        {/* GRAFICO: PLATOS MAS VISTOS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Platos mas vistos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Top 8 platos por numero de vistas</p>
            </div>
            <span className="text-2xl">🍽️</span>
          </div>
          <Bar data={dishesBarData} options={chartOptions} height={100} />
        </div>

        {/* FILA: FILTROS + IDIOMAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* FILTROS MAS USADOS */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">Filtros mas usados</h2>
                <p className="text-xs text-gray-400 mt-0.5">Preferencias de los clientes</p>
              </div>
              <span className="text-2xl">🔍</span>
            </div>
            <div className="space-y-3">
              {data.top_filters.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Sin datos todavia</p>
              )}
              {data.top_filters.map(f => {
                const max = data.top_filters[0]?.count || 1
                const pct = Math.round((f.count / max) * 100)
                return (
                  <div key={f.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {FILTER_LABELS[f.name] || f.name}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{f.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* IDIOMAS */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">Idiomas usados</h2>
                <p className="text-xs text-gray-400 mt-0.5">Clientes por idioma</p>
              </div>
              <span className="text-2xl">🌍</span>
            </div>
            {data.top_langs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin datos todavia</p>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-36 h-36 shrink-0">
                  <Doughnut
                    data={langsDoughnutData}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      cutout: '65%',
                    }}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  {data.top_langs.map((l, i) => {
                    const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-orange-500']
                    const total = data.top_langs.reduce((acc, x) => acc + x.count, 0)
                    const pct = Math.round((l.count / total) * 100)
                    return (
                      <div key={l.lang} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${colors[i] || 'bg-gray-400'}`} />
                          <span className="text-sm text-gray-700">
                            {LANG_LABELS[l.lang] || l.lang}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* TABLA RANKING DE PLATOS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Ranking de platos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Vistas y me gusta por plato</p>
            </div>
            <span className="text-2xl">🏆</span>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Plato</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Vistas</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">❤️ Likes</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Popularidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.top_dishes.map((dish, i) => {
                const max = data.top_dishes[0]?.count || 1
                const pct = Math.round((dish.count / max) * 100)
                const medals = ['🥇', '🥈', '🥉']
                const dishLike = data.dish_likes.find(d => d.name === dish.name)
                return (
                  <tr key={dish.name} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="text-lg">{medals[i] || `${i + 1}`}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 text-sm">{dish.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-orange-500 text-sm">{dish.count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-red-400 text-sm">
                        {dishLike ? `❤️ ${dishLike.likes}` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* TABLA LIKES POR PLATO */}
        {data.dish_likes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Platos mas queridos</h2>
                <p className="text-xs text-gray-400 mt-0.5">Ordenados por me gusta</p>
              </div>
              <span className="text-2xl">❤️</span>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Plato</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Me gusta</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Popularidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.dish_likes.map((dish, i) => {
                  const max = data.dish_likes[0]?.likes || 1
                  const pct = Math.round((dish.likes / max) * 100)
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <tr key={dish.name} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="text-lg">{medals[i] || `${i + 1}`}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 text-sm">{dish.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-red-400 text-sm">❤️ {dish.likes}</span>
                      </td>
                      <td className="px-6 py-4 w-48">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-400 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}