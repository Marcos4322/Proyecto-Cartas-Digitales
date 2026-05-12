function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sessionId = localStorage.getItem('menuai_session')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('menuai_session', sessionId)
  }
  return sessionId
}

export async function trackEvent(
  restaurantId: string,
  eventType: string,
  metadata: Record<string, string> = {}
) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        event_type: eventType,
        metadata,
        session_id: getSessionId(),
      }),
    })
  } catch {
    // Silencioso — el tracking nunca debe romper la carta
  }
}