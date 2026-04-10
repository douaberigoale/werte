import { useState } from 'react'
import type { BloodTestItem } from '../../types'
import { createBloodTestItem, updateBloodTestItem, deleteBloodTestItem } from '../../api/client'
import { useLang } from '../../i18n'
import DataTable from '../DataTable'
import { useSortable } from '../../utils/sortable'

interface Props {
  items: BloodTestItem[]
  onDataChange: () => void
}

type Draft = BloodTestItem

const EMPTY: Draft = {
  name: '',
  unit: '',
  description: null,
  normal_min: null,
  normal_max: null,
}

function num(s: string): number | null {
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function NumInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={e => onChange(num(e.target.value))}
      placeholder="—"
    />
  )
}

export default function ItemsTab({ items, onDataChange }: Props) {
  const { t } = useLang()
  const { sorted, sortHeader } = useSortable(items, 'name', 'asc')
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY)
  const [adding, setAdding] = useState(false)
  const [addDraft, setAddDraft] = useState<Draft>(EMPTY)

  function startEdit(item: BloodTestItem) {
    setEditingName(item.name)
    setEditDraft({ ...item })
  }

  async function saveEdit() {
    if (editingName == null) return
    await updateBloodTestItem(editingName, editDraft)
    setEditingName(null)
    onDataChange()
  }

  async function doDelete(name: string) {
    if (!confirm(t.deleteItemConfirm)) return
    await deleteBloodTestItem(name)
    onDataChange()
  }

  async function doAdd() {
    if (!addDraft.name.trim() || !addDraft.unit.trim()) return
    await createBloodTestItem(addDraft)
    setAddDraft(EMPTY)
    setAdding(false)
    onDataChange()
  }

  return (
    <div className="tab-panel">
      <div className="tab-panel-toolbar">
        {!adding && (
          <button className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setAddDraft(EMPTY) }}>
            {t.addItem}
          </button>
        )}
      </div>

      <DataTable headers={[sortHeader(t.name, 'name'), sortHeader(t.unit, 'unit'), sortHeader(t.description, 'description'), sortHeader(t.min, 'normal_min'), sortHeader(t.max, 'normal_max'), '']}>
        {adding && (
          <tr className="new-row">
            <td>
              <input type="text" value={addDraft.name}
                onChange={e => setAddDraft(d => ({ ...d, name: e.target.value }))}
                placeholder={`${t.name} *`} autoFocus />
            </td>
            <td>
              <input type="text" value={addDraft.unit}
                onChange={e => setAddDraft(d => ({ ...d, unit: e.target.value }))}
                placeholder={`${t.unit} *`} />
            </td>
            <td>
              <input type="text" value={addDraft.description ?? ''}
                onChange={e => setAddDraft(d => ({ ...d, description: e.target.value || null }))}
                placeholder={t.optional} />
            </td>
            <td>
              <NumInput value={addDraft.normal_min}
                onChange={v => setAddDraft(d => ({ ...d, normal_min: v }))} />
            </td>
            <td>
              <NumInput value={addDraft.normal_max}
                onChange={v => setAddDraft(d => ({ ...d, normal_max: v }))} />
            </td>
            <td className="row-actions">
              <button className="btn btn-primary btn-sm" onClick={doAdd}
                disabled={!addDraft.name.trim() || !addDraft.unit.trim()}>{t.add}</button>
              <button className="btn-icon" onClick={() => setAdding(false)} title="Cancel">✕</button>
            </td>
          </tr>
        )}

        {sorted.map(item =>
          editingName === item.name ? (
            <tr key={item.name} className="editing-row">
              <td>
                <input type="text" value={editDraft.name}
                  onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))} autoFocus />
              </td>
              <td>
                <input type="text" value={editDraft.unit}
                  onChange={e => setEditDraft(d => ({ ...d, unit: e.target.value }))} />
              </td>
              <td>
                <input type="text" value={editDraft.description ?? ''}
                  onChange={e => setEditDraft(d => ({ ...d, description: e.target.value || null }))}
                  placeholder={t.optional} />
              </td>
              <td>
                <NumInput value={editDraft.normal_min}
                  onChange={v => setEditDraft(d => ({ ...d, normal_min: v }))} />
              </td>
              <td>
                <NumInput value={editDraft.normal_max}
                  onChange={v => setEditDraft(d => ({ ...d, normal_max: v }))} />
              </td>
              <td className="row-actions">
                <button className="btn btn-primary btn-sm" onClick={saveEdit}>{t.save}</button>
                <button className="btn-icon" onClick={() => setEditingName(null)} title="Cancel">✕</button>
              </td>
            </tr>
          ) : (
            <tr key={item.name}>
              <td><strong>{item.name}</strong></td>
              <td><span className="unit-badge">{item.unit}</span></td>
              <td className="text-muted">{item.description ?? '—'}</td>
              <td>{item.normal_min ?? '—'}</td>
              <td>{item.normal_max ?? '—'}</td>
              <td className="row-actions">
                <button className="btn-icon" onClick={() => startEdit(item)} title="Edit">✎</button>
                <button className="btn-icon btn-icon-danger" onClick={() => doDelete(item.name)} title="Delete">✕</button>
              </td>
            </tr>
          )
        )}

        {items.length === 0 && !adding && (
          <tr>
            <td colSpan={6} className="empty-row">{t.noItemsYet}</td>
          </tr>
        )}
      </DataTable>
    </div>
  )
}
