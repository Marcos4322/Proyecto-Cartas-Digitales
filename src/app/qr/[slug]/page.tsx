'use client'

import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'

export default function QRPage({
  params,
}: {
  params: { slug: string }
}) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    const baseUrl = window.location.origin
    setUrl(`${baseUrl}/r/${params.slug}`)
  }, [params.slug])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-sm w-full text-center print:shadow-none">

        {/* Logo/Título */}
        <div className="mb-6">
          <p className="text-sm font-medium text-orange-500 uppercase tracking-widest mb-1">
            Carta Digital
          </p>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            {params.slug.replace(/-/g, ' ')}
          </h1>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl border-2 border-gray-100">
            {url && (
              <QRCode
                value={url}
                size={200}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              />
            )}
          </div>
        </div>

        {/* URL */}
        <p className="text-xs text-gray-400 mb-2">Escanea para ver la carta</p>
        <p className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-2 rounded-lg break-all mb-8">
          {url}
        </p>

        {/* Footer */}
        <div className="border-t pt-6">
          <p className="text-xs text-gray-400">
            Powered by{' '}
            <span className="font-bold text-orange-400">MenuAI</span>
          </p>
        </div>

        {/* Botón imprimir - se oculta al imprimir */}
        <button
          onClick={handlePrint}
          className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition print:hidden"
        >
          🖨️ Imprimir QR
        </button>

      </div>
    </div>
  )
}