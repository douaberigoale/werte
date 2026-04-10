/** Today as DD.MM.YYYY */
export function todayStr(): string {
  const d = new Date()
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

/** DD.MM.YYYY → YYYY-MM-DD for <input type="date"> value prop */
export function toInput(ddmmyyyy: string): string {
  if (!ddmmyyyy) return ''
  const [dd, mm, yyyy] = ddmmyyyy.split('.')
  return `${yyyy}-${mm}-${dd}`
}

/** YYYY-MM-DD → DD.MM.YYYY from <input type="date"> onChange */
export function fromInput(yyyymmdd: string): string {
  if (!yyyymmdd) return ''
  const [yyyy, mm, dd] = yyyymmdd.split('-')
  return `${dd}.${mm}.${yyyy}`
}

function dateKey(ddmmyyyy: string): number {
  const [dd, mm, yyyy] = ddmmyyyy.split('.')
  return parseInt(`${yyyy}${mm}${dd}`, 10)
}

/** Compare two DD.MM.YYYY strings: negative if a < b, positive if a > b */
export function cmpDate(a: string, b: string): number {
  return dateKey(a) - dateKey(b)
}

/** Add n days to a DD.MM.YYYY string, return DD.MM.YYYY */
export function addDays(ddmmyyyy: string, n: number): string {
  const iso = toInput(ddmmyyyy)
  if (!iso) return ddmmyyyy
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ddmmyyyy
  d.setDate(d.getDate() + n)
  return fromInput(d.toISOString().slice(0, 10))
}

/**
 * Normalize any date value from an Excel import to DD.MM.YYYY.
 * Handles: JS Date objects, YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY strings.
 */
export function normalizeDate(val: unknown): string {
  if (val == null || val === '') return ''

  // JS Date object (read-excel-file returns these for Excel date cells)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return ''
    return fromInput(val.toISOString().slice(0, 10))
  }

  // Number: Excel serial date (days since 1899-12-30)
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000)
    if (isNaN(d.getTime())) return ''
    return fromInput(d.toISOString().slice(0, 10))
  }

  if (typeof val !== 'string') return ''
  const s = val.trim()
  if (!s) return ''

  // Already DD.MM.YYYY
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('.')
    return `${pad(Number(dd))}.${pad(Number(mm))}.${yyyy}`
  }
  // YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return fromInput(s.slice(0, 10))
  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('/')
    return `${pad(Number(dd))}.${pad(Number(mm))}.${yyyy}`
  }
  // Last resort: native parse
  const d = new Date(s)
  if (!isNaN(d.getTime())) return fromInput(d.toISOString().slice(0, 10))
  return ''
}


function pad(n: number): string {
  return String(n).padStart(2, '0')
}
