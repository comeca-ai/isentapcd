/**
 * Rate limit em memória para login: 5 tentativas / 15 min por IP+e-mail.
 * Buckets expiram sozinhos; limpeza oportunista a cada verificação.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 1000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Retorna true se a tentativa é permitida; false se o limite estourou. */
export function allowLoginAttempt(ip: string, email: string): boolean {
  const now = Date.now();
  prune(now);
  const key = `${ip}|${email.toLowerCase()}`;
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= MAX_ATTEMPTS;
}

/** Limpa o bucket após login bem-sucedido. */
export function resetLoginAttempts(ip: string, email: string): void {
  buckets.delete(`${ip}|${email.toLowerCase()}`);
}
