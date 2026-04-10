import { useState, useEffect, useCallback } from 'react'
import type { BloodTestGroup, BloodTestItem, BloodTestResult, Event, Medication, MedicationIntake } from './types'
import {
  getBloodTestItems,
  getBloodTestResults,
  getMedications,
  getMedicationIntakes,
  getBloodTestGroups,
  getEvents,
} from './api/client'
import { I18nProvider, useLang } from './i18n'
import DataManagementBar from './components/DataManagementBar'
import DataEditor from './components/DataEditor'
import GraphSection from './components/GraphSection'

function AppContent() {
  const { lang, setLang, t } = useLang()
  const [dataOpen, setDataOpen] = useState(true)
  const [graphOpen, setGraphOpen] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [items, setItems] = useState<BloodTestItem[]>([])
  const [results, setResults] = useState<BloodTestResult[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [intakes, setIntakes] = useState<MedicationIntake[]>([])
  const [groups, setGroups] = useState<BloodTestGroup[]>([])
  const [events, setEvents] = useState<Event[]>([])

  const loadAll = useCallback(async () => {
    const [i, r, m, it, g, ev] = await Promise.all([
      getBloodTestItems(),
      getBloodTestResults(),
      getMedications(),
      getMedicationIntakes(),
      getBloodTestGroups(),
      getEvents(),
    ])
    setItems(i)
    setResults(r)
    setMedications(m)
    setIntakes(it)
    setGroups(g)
    setEvents(ev)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleDataChange = useCallback(() => {
    loadAll()
    setDirty(true)
  }, [loadAll])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-logo">Werte</span>
          <div className="header-right">
            <div className="lang-toggle">
              <button
                className={`lang-btn${lang === 'en' ? ' active' : ''}`}
                onClick={() => setLang('en')}
              >EN</button>
              <button
                className={`lang-btn${lang === 'de' ? ' active' : ''}`}
                onClick={() => setLang('de')}
              >DE</button>
            </div>
            <DataManagementBar onDataChange={loadAll} onSynced={() => setDirty(false)} />
          </div>
        </div>
      </header>

      {dirty && (
        <div className="unsaved-banner">
          ⚠ {t.unsavedWarning}
        </div>
      )}

      <main className="app-main">
        <section className="section">
          <div className="section-header collapsible" onClick={() => setDataOpen(v => !v)}>
            <h2>{t.data}</h2>
            <span className="collapse-arrow">{dataOpen ? '▾' : '▸'}</span>
          </div>
          {dataOpen && (
            <DataEditor
              items={items}
              results={results}
              medications={medications}
              intakes={intakes}
              groups={groups}
              events={events}
              onDataChange={handleDataChange}
            />
          )}
        </section>

        <section className="section">
          <div className="section-header collapsible" onClick={() => setGraphOpen(v => !v)}>
            <h2>{t.graph}</h2>
            <span className="collapse-arrow">{graphOpen ? '▾' : '▸'}</span>
          </div>
          {graphOpen && (
            <GraphSection
              items={items}
              results={results}
              intakes={intakes}
              groups={groups}
              events={events}
            />
          )}
        </section>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  )
}
