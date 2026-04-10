import type {
  BloodTestGroup,
  BloodTestItem,
  BloodTestResult,
  Event,
  Medication,
  MedicationIntake,
} from '../types'
import { normalizeDate } from '../utils/dates'

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  items: 'werte_blood_test_items',
  results: 'werte_blood_test_results',
  medications: 'werte_medications',
  intakes: 'werte_medication_intakes',
  groups: 'werte_blood_test_groups',
  events: 'werte_events',
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]')
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// ─── Blood Test Items ─────────────────────────────────────────────────────────

export function getBloodTestItems(): Promise<BloodTestItem[]> {
  return Promise.resolve(read<BloodTestItem>(KEYS.items))
}

export function createBloodTestItem(data: BloodTestItem): Promise<BloodTestItem> {
  const items = read<BloodTestItem>(KEYS.items)
  write(KEYS.items, [...items, data])
  return Promise.resolve(data)
}

export function updateBloodTestItem(
  name: string,
  data: Partial<BloodTestItem>,
): Promise<BloodTestItem> {
  const items = read<BloodTestItem>(KEYS.items)
  const item = items.find(i => i.name === name)
  if (!item) return Promise.reject(new Error('Not found'))
  const updated = { ...item, ...data }
  write(KEYS.items, items.map(i => i.name === name ? updated : i))
  if (data.name && data.name !== name) {
    write(KEYS.results, read<BloodTestResult>(KEYS.results).map(r =>
      r.blood_test_item_name === name ? { ...r, blood_test_item_name: data.name! } : r
    ))
    write(KEYS.groups, read<BloodTestGroup>(KEYS.groups).map(g => ({
      ...g,
      items: g.items.map(gi => gi.name === name ? { ...gi, name: data.name! } : gi),
    })))
  }
  return Promise.resolve(updated)
}

export function deleteBloodTestItem(name: string): Promise<void> {
  write(KEYS.items, read<BloodTestItem>(KEYS.items).filter(i => i.name !== name))
  write(KEYS.results, read<BloodTestResult>(KEYS.results).filter(r => r.blood_test_item_name !== name))
  write(KEYS.groups, read<BloodTestGroup>(KEYS.groups).map(g => ({
    ...g,
    items: g.items.filter(i => i.name !== name),
  })))
  return Promise.resolve()
}

// ─── Blood Test Results ───────────────────────────────────────────────────────

export function getBloodTestResults(date?: string): Promise<BloodTestResult[]> {
  const allItems = read<BloodTestItem>(KEYS.items)
  let results = read<BloodTestResult>(KEYS.results).map(r => ({ ...r, date: normalizeDate(r.date) }))
  if (date) results = results.filter(r => r.date === date)
  return Promise.resolve(results.map(r => ({
    ...r,
    blood_test_item: allItems.find(i => i.name === r.blood_test_item_name),
  })))
}

export function createBloodTestResults(
  newResults: Array<{ blood_test_item_name: string; date: string; value: number }>,
): Promise<BloodTestResult[]> {
  const allItems = read<BloodTestItem>(KEYS.items)
  const existing = read<BloodTestResult>(KEYS.results)
  write(KEYS.results, [...existing, ...newResults])
  return Promise.resolve(newResults.map(r => ({
    ...r,
    blood_test_item: allItems.find(i => i.name === r.blood_test_item_name),
  })))
}

export function updateBloodTestResult(
  blood_test_item_name: string,
  date: string,
  data: { value?: number; date?: string; blood_test_item_name?: string },
): Promise<BloodTestResult> {
  const allItems = read<BloodTestItem>(KEYS.items)
  const results = read<BloodTestResult>(KEYS.results)
  const idx = results.findIndex(r => r.blood_test_item_name === blood_test_item_name && r.date === date)
  if (idx === -1) return Promise.reject(new Error('Not found'))
  const updated = { ...results[idx], ...data }
  write(KEYS.results, results.map((r, i) => i === idx ? updated : r))
  return Promise.resolve({ ...updated, blood_test_item: allItems.find(i => i.name === updated.blood_test_item_name) })
}

export function deleteBloodTestResult(blood_test_item_name: string, date: string): Promise<void> {
  write(KEYS.results, read<BloodTestResult>(KEYS.results).filter(r =>
    !(r.blood_test_item_name === blood_test_item_name && r.date === date)
  ))
  return Promise.resolve()
}

// ─── Medications ──────────────────────────────────────────────────────────────

export function getMedications(): Promise<Medication[]> {
  return Promise.resolve(read<Medication>(KEYS.medications))
}

export function createMedication(data: { name: string; description?: string | null }): Promise<Medication> {
  const medications = read<Medication>(KEYS.medications)
  const med: Medication = { name: data.name, description: data.description ?? null }
  write(KEYS.medications, [...medications, med])
  return Promise.resolve(med)
}

export function updateMedication(name: string, data: { name: string; description?: string | null }): Promise<Medication> {
  const medications = read<Medication>(KEYS.medications)
  const med = medications.find(m => m.name === name)
  if (!med) return Promise.reject(new Error('Not found'))
  const updated = { ...med, ...data }
  write(KEYS.medications, medications.map(m => m.name === name ? updated : m))
  if (data.name && data.name !== name) {
    write(KEYS.intakes, read<MedicationIntake>(KEYS.intakes).map(i =>
      i.medication_name === name ? { ...i, medication_name: data.name } : i
    ))
  }
  return Promise.resolve(updated)
}

export function deleteMedication(name: string): Promise<void> {
  write(KEYS.medications, read<Medication>(KEYS.medications).filter(m => m.name !== name))
  write(KEYS.intakes, read<MedicationIntake>(KEYS.intakes).filter(i => i.medication_name !== name))
  return Promise.resolve()
}

// ─── Medication Intakes ───────────────────────────────────────────────────────

export function getMedicationIntakes(): Promise<MedicationIntake[]> {
  const medications = read<Medication>(KEYS.medications)
  const intakes = read<MedicationIntake>(KEYS.intakes).map(i => ({
    ...i,
    start_date: normalizeDate(i.start_date),
    end_date: i.end_date != null ? normalizeDate(i.end_date) || null : null,
  }))
  return Promise.resolve(intakes.map(i => ({
    ...i,
    medication: medications.find(m => m.name === i.medication_name),
  })))
}

export function createMedicationIntakes(
  newIntakes: Array<{
    medication_name: string
    daily_dose: number
    start_date: string
    end_date?: string | null
  }>,
): Promise<MedicationIntake[]> {
  const medications = read<Medication>(KEYS.medications)
  const existing = read<MedicationIntake>(KEYS.intakes)
  const created = newIntakes.map(i => ({
    medication_name: i.medication_name,
    daily_dose: i.daily_dose,
    start_date: i.start_date,
    end_date: i.end_date ?? null,
  }))
  write(KEYS.intakes, [...existing, ...created])
  return Promise.resolve(created.map(i => ({
    ...i,
    medication: medications.find(m => m.name === i.medication_name),
  })))
}

export function updateMedicationIntake(
  medication_name: string,
  start_date: string,
  data: { daily_dose: number; start_date: string; end_date: string | null },
): Promise<MedicationIntake> {
  const medications = read<Medication>(KEYS.medications)
  const intakes = read<MedicationIntake>(KEYS.intakes)
  const idx = intakes.findIndex(i => i.medication_name === medication_name && i.start_date === start_date)
  if (idx === -1) return Promise.reject(new Error('Not found'))
  const updated = { ...intakes[idx], ...data }
  write(KEYS.intakes, intakes.map((i, j) => j === idx ? updated : i))
  return Promise.resolve({ ...updated, medication: medications.find(m => m.name === updated.medication_name) })
}

export function deleteMedicationIntake(medication_name: string, start_date: string): Promise<void> {
  write(KEYS.intakes, read<MedicationIntake>(KEYS.intakes).filter(i =>
    !(i.medication_name === medication_name && i.start_date === start_date)
  ))
  return Promise.resolve()
}

// ─── Blood Test Groups ────────────────────────────────────────────────────────

export function getBloodTestGroups(): Promise<BloodTestGroup[]> {
  const allItems = read<BloodTestItem>(KEYS.items)
  const groups = read<BloodTestGroup>(KEYS.groups)
  return Promise.resolve(groups.map(g => ({
    ...g,
    items: g.items
      .map(gi => allItems.find(i => i.name === gi.name))
      .filter((i): i is BloodTestItem => i !== undefined),
  })))
}

export function createBloodTestGroup(data: { name: string }): Promise<BloodTestGroup> {
  const groups = read<BloodTestGroup>(KEYS.groups)
  const group: BloodTestGroup = {
    name: data.name,
    sort_order: groups.length,
    items: [],
  }
  write(KEYS.groups, [...groups, group])
  return Promise.resolve(group)
}

export function updateBloodTestGroup(name: string, data: { name: string }): Promise<BloodTestGroup> {
  const groups = read<BloodTestGroup>(KEYS.groups)
  const group = groups.find(g => g.name === name)
  if (!group) return Promise.reject(new Error('Not found'))
  const updated = { ...group, ...data }
  write(KEYS.groups, groups.map(g => g.name === name ? updated : g))
  return Promise.resolve(updated)
}

export function deleteBloodTestGroup(name: string): Promise<void> {
  write(KEYS.groups, read<BloodTestGroup>(KEYS.groups).filter(g => g.name !== name))
  return Promise.resolve()
}

export function syncBloodTestGroupItems(groupName: string, item_names: string[]): Promise<BloodTestGroup> {
  const allItems = read<BloodTestItem>(KEYS.items)
  const groups = read<BloodTestGroup>(KEYS.groups)
  const group = groups.find(g => g.name === groupName)
  if (!group) return Promise.reject(new Error('Not found'))
  const items = item_names
    .map(name => allItems.find(i => i.name === name))
    .filter((i): i is BloodTestItem => i !== undefined)
  const updated = { ...group, items }
  write(KEYS.groups, groups.map(g => g.name === groupName ? updated : g))
  return Promise.resolve(updated)
}

// ─── Events ───────────────────────────────────────────────────────────────────

export function getEvents(): Promise<Event[]> {
  return Promise.resolve(
    read<Event>(KEYS.events).map(e => ({ ...e, date: normalizeDate(e.date) }))
  )
}

export function createEvent(data: { name: string; date: string }): Promise<Event> {
  const events = read<Event>(KEYS.events)
  const event: Event = { name: data.name, date: data.date }
  write(KEYS.events, [...events, event])
  return Promise.resolve(event)
}

export function updateEvent(name: string, date: string, data: { name: string; date: string }): Promise<Event> {
  const events = read<Event>(KEYS.events)
  const idx = events.findIndex(e => e.name === name && e.date === date)
  if (idx === -1) return Promise.reject(new Error('Not found'))
  const updated = { ...events[idx], ...data }
  write(KEYS.events, events.map((e, i) => i === idx ? updated : e))
  return Promise.resolve(updated)
}

export function deleteEvent(name: string, date: string): Promise<void> {
  write(KEYS.events, read<Event>(KEYS.events).filter(e => !(e.name === name && e.date === date)))
  return Promise.resolve()
}

// ─── XLSX export / import ─────────────────────────────────────────────────────

export { KEYS as storageKeys, read as readStore, write as writeStore }
