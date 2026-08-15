import { useEffect, useState } from 'react'

/**
 * "Agora" atualizado a cada minuto (countdowns do app são informação, não
 * decoração — app-dashboard.md a11y: texto estático, tick por minuto).
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
