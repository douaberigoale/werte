import { useRef, useState } from 'react'
import { exportToXlsx, importFromXlsx } from '../storage/xlsx'
import { storageKeys } from '../api/client'
import { useLang } from '../i18n'

interface Props {
  onDataChange: () => void
  onSynced: () => void   // called after export, import, or clear — data is now in sync
}

export default function DataManagementBar({ onDataChange, onSynced }: Props) {
  const { t } = useLang()
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function flash(type: 'success' | 'error', msg: string) {
    setStatus({ type, msg })
    setTimeout(() => setStatus(null), 3000)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm(t.importConfirm)) {
      e.target.value = ''
      return
    }
    try {
      await importFromXlsx(file)
      flash('success', t.importSuccess)
      onDataChange()
      onSynced()
    } catch {
      flash('error', t.importFailed)
    }
    e.target.value = ''
  }

  async function handleExport() {
    try {
      await exportToXlsx()
      flash('success', t.exported)
      onSynced()
    } catch {
      flash('error', t.exportFailed)
    }
  }

  function handleClear() {
    if (!confirm(t.clearConfirm)) return
    Object.values(storageKeys).forEach(key => localStorage.removeItem(key))
    flash('success', t.dataCleared)
    onDataChange()
    onSynced()
  }

  return (
    <div className="dmbar">
      <input ref={fileRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={handleImport} />
      <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
        {t.uploadXlsx}
      </button>
      <button className="btn btn-ghost btn-sm" onClick={handleExport}>
        {t.exportXlsx}
      </button>
      <button className="btn btn-ghost btn-sm btn-ghost-danger" onClick={handleClear}>
        {t.clearData}
      </button>
      {status && (
        <span className={`dmbar-status ${status.type}`} onClick={() => setStatus(null)}>
          {status.msg}
        </span>
      )}
    </div>
  )
}
