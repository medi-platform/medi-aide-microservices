/**
 * Request context helpers applied at the HTTP edge.
 *
 * This is intentionally dependency-free and safe to apply to all services.
 */

export function applyRequestContext(req: any, res: any, next: any) {
  const headerRequestId =
    (typeof req?.get === 'function' && (req.get('x-request-id') || req.get('x-correlation-id'))) ||
    req?.headers?.['x-request-id'] ||
    req?.headers?.['x-correlation-id'];

  const requestId = normalizeRequestId(headerRequestId) || generateRequestId();
  req.requestId = requestId;

  if (typeof res?.setHeader === 'function') {
    res.setHeader('X-Request-ID', requestId);
  }

  next();
}

function normalizeRequestId(value: unknown): string | null {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  // Keep it bounded to avoid log/header abuse.
  return s.length > 200 ? s.slice(0, 200) : s;
}

function generateRequestId(): string {
  // Node 18+ supports crypto.randomUUID()
  try {
    const crypto = require('crypto') as typeof import('crypto');
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // fall through
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
