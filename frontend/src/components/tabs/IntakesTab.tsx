import { Fragment, useState } from 'react'
import type { Medication, MedicationIntake } from '../../types'
import { createMedicationIntakes, updateMedicationIntake, deleteMedicationIntake } from '../../api/client'
import { useLang } from '../../i18n'
import DataTable from '../DataTable'
import { todayStr, toInput, fromInput, cmpDate } from '../../utils/dates'
import { useSortable } from '../../utils/sortable'

interface Props {
  intakes: MedicationIntake[]
  medications: Medication[]
  onDataChange: () => void
}

interface EditDraft {
  medication_name: string
  daily_dose: string
  start_date: string
  end_date: string
}

interface BatchRow {
  medication_name: string
  daily_dose: string
  end_date: string
}

type GroupBy = 'none' | 'medication'

export default function IntakesTab({ intakes, medications, onDataChange }: Props) {
  const { t } = useLang()
  const [editingKey, setEditingKey] = useState<{ medication_name: string; start_date: string } | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft>({ medication_name: '', daily_dose: '', start_date: todayStr(), end_date: '' })
  const [adding, setAdding] = useState(false)
  const [batchStartDate, setBatchStartDate] = useState(todayStr())
  const [batchRows, setBatchRows] = useState<BatchRow[]>([{ medication_name: '', daily_dose: '', end_date: '' }])

  const [filterFrom, setFilterFrom] = useState<string>('')
  const [filterTo, setFilterTo] = useState<string>('')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')

  const getValue = (intake: MedicationIntake, col: string) => {
    if (col === 'name') return intake.medication?.name ?? intake.medication_name
    return (intake as unknown as Record<string, unknown>)[col]
  }
  const { sorted, sortHeader } = useSortable(intakes, 'start_date', 'desc', getValue)

  const filtered = sorted.filter(i => {
    if (filterFrom && i.end_date && cmpDate(i.end_date, filterFrom) < 0) return false
    if (filterTo && cmpDate(i.start_date, filterTo) > 0) return false
    return true
  })
  const hasFilter = filterFrom || filterTo

  // Grouping
  const groups: { key: string; rows: MedicationIntake[] }[] = (() => {
    if (groupBy === 'none') return [{ key: '', rows: filtered }]
    const map = new Map<string, MedicationIntake[]>()
    filtered.forEach(i => {
      const key = i.medication_name
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(i)
    })
    const arr = Array.from(map.entries()).map(([key, rows]) => ({ key, rows }))
    arr.sort((a, b) => a.key.localeCompare(b.key))
    return arr
  })()

  function startEdit(intake: MedicationIntake) {
    setEditingKey({ medication_name: intake.medication_name, start_date: intake.start_date })
    setEditDraft({
      medication_name: intake.medication_name,
      daily_dose: String(intake.daily_dose),
      start_date: intake.start_date,
      end_date: intake.end_date ?? '',
    })
  }

  async function saveEdit() {
    if (editingKey == null || editDraft.medication_name === '') return
    const dose = parseFloat(editDraft.daily_dose)
    if (isNaN(dose)) return
    await updateMedicationIntake(editingKey.medication_name, editingKey.start_date, {
      daily_dose: dose,
      start_date: editDraft.start_date,
      end_date: editDraft.end_date || null,
    })
    setEditingKey(null)
    onDataChange()
  }

  async function doDelete(medication_name: string, start_date: string) {
    if (!confirm(t.deleteIntakeConfirm)) return
    await deleteMedicationIntake(medication_name, start_date)
    onDataChange()
  }

  function startAdd() {
    setAdding(true)
    setBatchStartDate(todayStr())
    setBatchRows([{ medication_name: '', daily_dose: '', end_date: '' }])
  }

  function addBatchRow() {
    setBatchRows(rows => [...rows, { medication_name: '', daily_dose: '', end_date: '' }])
  }

  function removeBatchRow(i: number) {
    setBatchRows(rows => rows.filter((_, j) => j !== i))
  }

  function updateBatchRow(i: number, patch: Partial<BatchRow>) {
    setBatchRows(rows => rows.map((r, j) => j === i ? { ...r, ...patch } : r))
  }

  async function doAdd() {
    const valid = batchRows.filter(r => r.medication_name !== '' && r.daily_dose !== '')
    if (valid.length === 0 || !batchStartDate) return
    const parsed = valid.map(r => ({
      medication_name: r.medication_name,
      daily_dose: parseFloat(r.daily_dose),
      start_date: batchStartDate,
      end_date: r.end_date || null,
    }))
    if (parsed.some(r => isNaN(r.daily_dose))) return
    await createMedicationIntakes(parsed)
    setAdding(false)
    onDataChange()
  }

  const canSave = batchRows.some(r => r.medication_name !== '' && r.daily_dose !== '') && !!batchStartDate

  return (
    <div className="tab-panel">
      <div className="tab-panel-toolbar">
        <div className="filter-bar">
          <label className="filter-range-label">{t.from}</label>
          <input type="date" value={toInput(filterFrom)} onChange={e => setFilterFrom(fromInput(e.target.value))}
            style={{ width: 'auto' }} />
          <label className="filter-range-label">{t.to}</label>
          <input type="date" value={toInput(filterTo)} onChange={e => setFilterTo(fromInput(e.target.value))}
            style={{ width: 'auto' }} />
          {hasFilter && (
            <button className="btn-icon" onClick={() => { setFilterFrom(''); setFilterTo('') }}>✕</button>
          )}
          <label className="filter-range-label">Group:</label>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value as GroupBy)} style={{ width: 'auto' }}>
            <option value="none">None</option>
            <option value="medication">{t.medication}</option>
          </select>
        </div>
        {adding ? (
          <div className="batch-controls">
            <button className="btn btn-primary btn-sm" onClick={doAdd} disabled={!canSave}>{t.saveAll}</button>
            <button className="btn-icon" onClick={() => setAdding(false)} title="Cancel">✕</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={startAdd} disabled={medications.length === 0}>
            {t.addIntake}
          </button>
        )}
      </div>

      {medications.length === 0 && (
        <p className="info-hint">{t.addMedicationsFirst}</p>
      )}

      <DataTable headers={[sortHeader(t.medication, 'name'), sortHeader(t.dailyDose, 'daily_dose'), sortHeader(t.startDate, 'start_date'), sortHeader(t.endDate, 'end_date'), '']}>
        {adding && (
          <>
            {batchRows.map((row, i) => (
              <tr key={i} className="new-row">
                <td>
                  <select value={row.medication_name}
                    onChange={e => updateBatchRow(i, { medication_name: e.target.value })}
                    autoFocus={i === 0}>
                    <option value="">{t.selectMedication}</option>
                    {medications.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                  </select>
                </td>
                <td>
                  <input type="number" value={row.daily_dose}
                    onChange={e => updateBatchRow(i, { daily_dose: e.target.value })}
                    placeholder={t.dosePlaceholder} />
                </td>
                <td>
                  {i === 0 ? (
                    <input type="date" value={toInput(batchStartDate)}
                      onChange={e => setBatchStartDate(fromInput(e.target.value))} />
                  ) : (
                    <span className="batch-shared-date">{batchStartDate}</span>
                  )}
                </td>
                <td>
                  <input type="date" value={toInput(row.end_date)}
                    onChange={e => updateBatchRow(i, { end_date: fromInput(e.target.value) })} />
                </td>
                <td className="row-actions">
                  {i === batchRows.length - 1 && (
                    <button className="btn-icon" onClick={addBatchRow} title={t.addAnother}>+</button>
                  )}
                  {batchRows.length > 1 && (
                    <button className="btn-icon btn-icon-danger" onClick={() => removeBatchRow(i)} title="Remove">✕</button>
                  )}
                </td>
              </tr>
            ))}
          </>
        )}

        {groups.map(group => (
          <Fragment key={group.key || '__all'}>
            {groupBy !== 'none' && (
              <tr className="group-header-row">
                <td colSpan={5}>{group.key}</td>
              </tr>
            )}
            {group.rows.map(intake =>
              editingKey?.medication_name === intake.medication_name && editingKey?.start_date === intake.start_date ? (
                <tr key={intake.medication_name + '|' + intake.start_date} className="editing-row">
                  <td>
                    <select value={editDraft.medication_name}
                      onChange={e => setEditDraft(d => ({ ...d, medication_name: e.target.value }))}>
                      {medications.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <input type="number" value={editDraft.daily_dose}
                      onChange={e => setEditDraft(d => ({ ...d, daily_dose: e.target.value }))} />
                  </td>
                  <td>
                    <input type="date" value={toInput(editDraft.start_date)}
                      onChange={e => setEditDraft(d => ({ ...d, start_date: fromInput(e.target.value) }))} />
                  </td>
                  <td>
                    <input type="date" value={toInput(editDraft.end_date)}
                      onChange={e => setEditDraft(d => ({ ...d, end_date: fromInput(e.target.value) }))} />
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}>{t.save}</button>
                    <button className="btn-icon" onClick={() => setEditingKey(null)} title="Cancel">✕</button>
                  </td>
                </tr>
              ) : (
                <tr key={intake.medication_name + '|' + intake.start_date}>
                  <td>{intake.medication_name}</td>
                  <td>{intake.daily_dose}</td>
                  <td>{intake.start_date}</td>
                  <td>{intake.end_date ?? <span className="text-muted">{t.ongoing}</span>}</td>
                  <td className="row-actions">
                    <button className="btn-icon" onClick={() => startEdit(intake)} title="Edit">✎</button>
                    <button className="btn-icon btn-icon-danger" onClick={() => doDelete(intake.medication_name, intake.start_date)} title="Delete">✕</button>
                  </td>
                </tr>
              )
            )}
          </Fragment>
        ))}

        {filtered.length === 0 && !adding && (
          <tr>
            <td colSpan={5} className="empty-row">{t.noIntakesYet}</td>
          </tr>
        )}
      </DataTable>
    </div>
  )
}
