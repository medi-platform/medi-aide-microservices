export const CANADIAN_TIMEZONES = [
  'America/Vancouver', // Pacific Time (BC)
  'America/Edmonton', // Mountain Time (AB)
  'America/Regina', // Central Time (SK - no DST)
  'America/Winnipeg', // Central Time (MB)
  'America/Toronto', // Eastern Time (ON, QC)
  'America/Halifax', // Atlantic Time (NS, NB, PE)
  'America/St_Johns', // Newfoundland Time (NL)
] as const;

export type CanadianTimezone = (typeof CANADIAN_TIMEZONES)[number];

export const DEFAULT_TIMEZONE: CanadianTimezone = 'America/Toronto';

export function normalizeCanadianTimezone(input?: string | null): CanadianTimezone {
  if (!input) return DEFAULT_TIMEZONE;
  const trimmed = String(input).trim();
  if (!trimmed) return DEFAULT_TIMEZONE;

  // Only allow Canada TZs to match monolith behavior.
  if ((CANADIAN_TIMEZONES as readonly string[]).includes(trimmed)) {
    return trimmed as CanadianTimezone;
  }

  return DEFAULT_TIMEZONE;
}

/**
 * Apply timezone context to an Express request/response.
 *
 * - Reads `X-Timezone` (case-insensitive via Express) and normalizes it.
 * - Attaches `req.timezone` for downstream handlers.
 * - Echoes `X-Timezone` on the response for visibility/debugging.
 */
export function applyTimezoneContext(req: any, res: any, next: any) {
  const headerTz = typeof req?.get === 'function' ? req.get('x-timezone') : undefined;
  const tz = normalizeCanadianTimezone(headerTz);
  req.timezone = tz;
  if (typeof res?.setHeader === 'function') {
    res.setHeader('X-Timezone', tz);
  }
  next();
}
