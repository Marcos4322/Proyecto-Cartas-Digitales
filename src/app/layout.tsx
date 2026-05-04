import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MenuAI — La carta inteligente',
  description: 'Carta digital con IA para restaurantes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}