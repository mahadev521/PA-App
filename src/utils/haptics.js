// Light haptic feedback where the platform supports it. iOS Safari ignores
// navigator.vibrate entirely, so this is a silent no-op there — callers never
// need to branch on support.

const PATTERNS = {
  tap:     8,
  select:  14,
  success: [10, 35, 16],
  warn:    [18, 55, 18],
  error:   [30, 60, 30, 60, 30],
}

export function haptic(kind = 'tap') {
  try {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return
    navigator.vibrate(PATTERNS[kind] ?? PATTERNS.tap)
  } catch {
    // Some embedded webviews throw on vibrate — never let feedback break a tap.
  }
}
