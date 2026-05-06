import { NextResponse } from 'next/server'

async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=es|${targetLang}&de=menuai@menuai.com`
    const res = await fetch(url)
    const data = await res.json()

    const translated = data.responseData?.translatedText

    // Si la traducción es igual al original o está vacía, devolver texto original
    if (!translated || translated.toLowerCase() === text.toLowerCase()) {
      return text
    }

    return translated
  } catch {
    return text
  }
}

export async function POST(request: Request) {
  const { text } = await request.json()

  if (!text) {
    return NextResponse.json({ error: 'text es obligatorio' }, { status: 400 })
  }

  // Traducir en paralelo
  const [en, de, fr] = await Promise.all([
    translateText(text, 'en-GB'),
    translateText(text, 'de-DE'),
    translateText(text, 'fr-FR'),
  ])

  return NextResponse.json({ en, de, fr })
}