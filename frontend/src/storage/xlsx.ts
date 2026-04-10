import writeXlsxFile from 'write-excel-file/browser'
import readXlsxFile from 'read-excel-file/browser'
import type { SheetData } from 'write-excel-file/browser'
import type { BloodTestGroup, BloodTestItem, BloodTestResult, Event, Medication, MedicationIntake } from '../types'
import { storageKeys, readStore, writeStore } from '../api/client'
import { normalizeDate } from '../utils/dates'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSheet(objects: Record<string, unknown>[], headers: string[]): SheetData {
  const rows = objects.map(obj =>
    headers.map(h => {
      const v = obj[h]
      if (v === null || v === undefined) return null
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v
      return String(v)
    })
  )
  return [headers, ...rows] as SheetData
}

function rowsToObjects(rows: (string | number | boolean | null)[][]): Record<string, unknown>[] {
  if (rows.length < 2) return []
  const headers = rows[0].map(h => String(h ?? ''))
  return rows.slice(1)
    .map(row => {
      const obj: Record<string, unknown> = {}
      headers.forEach((h, i) => { obj[h] = row[i] })
      return obj
    })
    .filter(obj => Object.values(obj).some(v => v !== null && v !== ''))
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportToXlsx(): Promise<void> {
  const items = readStore<BloodTestItem>(storageKeys.items)
  const results = readStore<BloodTestResult>(storageKeys.results)
  const medications = readStore<Medication>(storageKeys.medications)
  const intakes = readStore<MedicationIntake>(storageKeys.intakes)
  const groups = readStore<BloodTestGroup>(storageKeys.groups)
  const events = readStore<Event>(storageKeys.events)

  const groupMeta = groups.map(({ items: _, ...g }) => g)
  const groupItems = groups.flatMap(g => g.items.map(i => ({ group_name: g.name, item_name: i.name })))

  await writeXlsxFile(
    [
      toSheet(items as unknown as Record<string, unknown>[], ['name', 'description', 'unit', 'normal_min', 'normal_max']),
      toSheet(results as unknown as Record<string, unknown>[], ['blood_test_item_name', 'date', 'value']),
      toSheet(medications as unknown as Record<string, unknown>[], ['name', 'description']),
      toSheet(intakes as unknown as Record<string, unknown>[], ['medication_name', 'daily_dose', 'start_date', 'end_date']),
      toSheet(groupMeta as unknown as Record<string, unknown>[], ['name', 'sort_order']),
      toSheet(groupItems as unknown as Record<string, unknown>[], ['group_name', 'item_name']),
      toSheet(events as unknown as Record<string, unknown>[], ['name', 'date']),
    ],
    {
      sheets: ['types', 'results', 'medications', 'intake', 'groups', 'group_items', 'events'],
      fileName: 'werte-data.xlsx',
    }
  )
}

// ─── Import ───────────────────────────────────────────────────────────────────

export async function importFromXlsx(file: File): Promise<void> {
  const allSheets = await readXlsxFile(file)
  const getSheet = (name: string) => {
    const found = allSheets.find(s => s.sheet === name)
    return rowsToObjects((found?.data ?? []) as (string | number | boolean | null)[][])
  }

  const items = getSheet('types') as unknown as BloodTestItem[]
  const rawResults = getSheet('results') as unknown as BloodTestResult[]
  const results: BloodTestResult[] = rawResults.map(r => ({ ...r, date: normalizeDate(r.date) }))
  const medications = getSheet('medications') as unknown as Medication[]
  const rawIntakes = getSheet('intake') as unknown as MedicationIntake[]
  const intakes: MedicationIntake[] = rawIntakes.map(i => ({
    ...i,
    start_date: normalizeDate(i.start_date),
    end_date: i.end_date != null ? normalizeDate(i.end_date) || null : null,
  }))
  const groupMeta = getSheet('groups') as { name: string; sort_order: number }[]
  const groupItemRows = getSheet('group_items') as { group_name: string; item_name: string }[]
  const rawEvents = getSheet('events') as unknown as Event[]
  const events: Event[] = rawEvents.map(e => ({ ...e, date: normalizeDate(e.date) }))

  const fullGroups: BloodTestGroup[] = groupMeta.map(g => ({
    ...g,
    items: groupItemRows
      .filter(gi => gi.group_name === g.name)
      .map(gi => items.find(i => i.name === gi.item_name))
      .filter((i): i is BloodTestItem => i !== undefined),
  }))

  writeStore(storageKeys.items, items)
  writeStore(storageKeys.results, results)
  writeStore(storageKeys.medications, medications)
  writeStore(storageKeys.intakes, intakes)
  writeStore(storageKeys.groups, fullGroups)
  writeStore(storageKeys.events, events)
}
