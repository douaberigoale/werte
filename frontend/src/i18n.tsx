import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'en' | 'de'

const en = {
  // App / header
  data: 'Data',
  graph: 'Graph',
  unsavedWarning: 'Unsaved changes — export the XLSX to avoid losing data.',
  // DataManagementBar
  uploadXlsx: 'Upload XLSX',
  exportXlsx: 'Export XLSX',
  clearData: 'Clear Data',
  importConfirm: 'This will replace all existing data. Continue?',
  importSuccess: 'Imported successfully',
  importFailed: 'Import failed — check the file format',
  exported: 'Exported',
  exportFailed: 'Export failed',
  clearConfirm: 'Clear all data from local storage? This cannot be undone.',
  dataCleared: 'Data cleared',
  // DataEditor tabs
  tabTypes: 'Types',
  tabResults: 'Results',
  tabMedications: 'Medications',
  tabIntakes: 'Medication Intakes',
  tabGroups: 'Groups',
  // ItemsTab
  addItem: '+ Add Type',
  name: 'Name',
  unit: 'Unit',
  description: 'Description',
  min: 'Min',
  max: 'Max',
  save: 'Save',
  add: 'Add',
  optional: 'optional',
  noItemsYet: 'No types yet — click "Add Type" to get started.',
  deleteItemConfirm: 'Delete this type and all its results?',
  // Filters
  from: 'From',
  to: 'To',
  // ResultsTab
  addResult: '+ Add Result',
  allItems: 'All types',
  date: 'Date',
  item: 'Type',
  value: 'Value',
  noResultsYet: 'No results yet — click "Add Result" to record one.',
  noResultsMatch: 'No results match the filter.',
  addItemsFirst: 'Add types first, then you can record results here.',
  deleteResultConfirm: 'Delete this result?',
  selectItem: '— select type —',
  // MedicationsTab
  addMedication: '+ Add Medication',
  noMedicationsYet: 'No medications yet — click "Add Medication".',
  deleteMedConfirm: 'Delete this medication and all its intake records?',
  medicationNamePlaceholder: 'Medication name *',
  // IntakesTab
  addIntake: '+ Add Intake',
  addMedicationsFirst: 'Add medications first, then you can record intake periods here.',
  medication: 'Medication',
  dailyDose: 'Daily dose',
  startDate: 'Start date',
  endDate: 'End date',
  ongoing: 'ongoing',
  noIntakesYet: 'No intake records yet.',
  deleteIntakeConfirm: 'Delete this intake record?',
  selectMedication: '— select medication —',
  dosePlaceholder: 'dose',
  // EventsTab
  tabEvents: 'Events',
  addEvent: '+ Add Event',
  noEventsYet: 'No events yet — click "Add Event" to get started.',
  deleteEventConfirm: 'Delete this event?',
  // GroupsTab
  newGroupNamePlaceholder: 'New group name…',
  createGroup: '+ Create Group',
  noGroupsYet: 'No groups yet. Groups let you display subsets of types as separate charts.',
  noBloodTestItems: 'No types available.',
  deleteGroupConfirm: (name: string) => `Delete group "${name}"?`,
  groupItemCount: (n: number) => `${n} item${n !== 1 ? 's' : ''}`,
  // Batch add
  addAnother: 'Add another',
  saveAll: 'Save all',
  // WerteChart
  resetZoom: 'Reset zoom',
  scrollToZoom: 'Scroll to zoom · Drag timeline to pan',
  noDataYet: 'No data available yet. Add results or medication intakes to get started.',
  // GraphSection
  noItemsInGroup: 'No types assigned to this group yet.',
  noResultsInGroup: 'No results for this group yet.',
} as const

type Translations = { [K in keyof typeof en]: (typeof en)[K] extends string ? string : (typeof en)[K] }

const de: Translations = {
  data: 'Daten',
  graph: 'Diagramm',
  unsavedWarning: 'Nicht exportierte Änderungen — exportiere die XLSX um Datenverlust zu vermeiden.',
  uploadXlsx: 'XLSX hochladen',
  exportXlsx: 'XLSX exportieren',
  clearData: 'Daten löschen',
  importConfirm: 'Dies ersetzt alle vorhandenen Daten. Fortfahren?',
  importSuccess: 'Erfolgreich importiert',
  importFailed: 'Import fehlgeschlagen — Dateiformat prüfen',
  exported: 'Exportiert',
  exportFailed: 'Export fehlgeschlagen',
  clearConfirm: 'Alle Daten löschen? Dies kann nicht rückgängig gemacht werden.',
  dataCleared: 'Daten gelöscht',
  tabTypes: 'Typen',
  tabResults: 'Ergebnisse',
  tabMedications: 'Medikamente',
  tabIntakes: 'Einnahmen',
  tabGroups: 'Gruppen',
  addItem: '+ Typ hinzufügen',
  name: 'Name',
  unit: 'Einheit',
  description: 'Beschreibung',
  min: 'Min',
  max: 'Max',
  save: 'Speichern',
  add: 'Hinzufügen',
  optional: 'optional',
  noItemsYet: 'Noch keine Typen — klicke "Typ hinzufügen" um zu beginnen.',
  deleteItemConfirm: 'Diesen Typ und alle Ergebnisse löschen?',
  addResult: '+ Ergebnis hinzufügen',
  allItems: 'Alle Typen',
  date: 'Datum',
  item: 'Typ',
  value: 'Wert',
  noResultsYet: 'Noch keine Ergebnisse — klicke "Ergebnis hinzufügen".',
  noResultsMatch: 'Keine Ergebnisse entsprechen dem Filter.',
  addItemsFirst: 'Erst Typen hinzufügen, dann können hier Ergebnisse eingetragen werden.',
  deleteResultConfirm: 'Dieses Ergebnis löschen?',
  selectItem: '— Typ auswählen —',
  addMedication: '+ Medikament hinzufügen',
  noMedicationsYet: 'Noch keine Medikamente — klicke "Medikament hinzufügen".',
  deleteMedConfirm: 'Dieses Medikament und alle Einnahmen löschen?',
  medicationNamePlaceholder: 'Medikamentname *',
  addIntake: '+ Einnahme hinzufügen',
  addMedicationsFirst: 'Erst Medikamente hinzufügen, dann können Einnahmen eingetragen werden.',
  medication: 'Medikament',
  dailyDose: 'Tagesdosis',
  startDate: 'Startdatum',
  endDate: 'Enddatum',
  ongoing: 'laufend',
  noIntakesYet: 'Noch keine Einnahmen.',
  deleteIntakeConfirm: 'Diesen Einnahmeeintrag löschen?',
  from: 'Von',
  to: 'Bis',
  selectMedication: '— Medikament auswählen —',
  dosePlaceholder: 'Dosis',
  tabEvents: 'Ereignisse',
  addEvent: '+ Ereignis hinzufügen',
  noEventsYet: 'Noch keine Ereignisse — klicke "Ereignis hinzufügen" um zu beginnen.',
  deleteEventConfirm: 'Dieses Ereignis löschen?',
  newGroupNamePlaceholder: 'Neuer Gruppenname…',
  createGroup: '+ Gruppe erstellen',
  noGroupsYet: 'Noch keine Gruppen. Gruppen ermöglichen separate Diagramme für Teilmengen.',
  noBloodTestItems: 'Keine Typen verfügbar.',
  deleteGroupConfirm: (name: string) => `Gruppe "${name}" löschen?`,
  groupItemCount: (n: number) => `${n} Element${n !== 1 ? 'e' : ''}`,
  addAnother: 'Weiteres hinzufügen',
  saveAll: 'Alle speichern',
  resetZoom: 'Zoom zurücksetzen',
  scrollToZoom: 'Scrollen zum Zoomen · Timeline ziehen zum Verschieben',
  noDataYet: 'Noch keine Daten. Ergebnisse oder Einnahmen hinzufügen.',
  noItemsInGroup: 'Dieser Gruppe sind noch keine Typen zugewiesen.',
  noResultsInGroup: 'Noch keine Ergebnisse für diese Gruppe.',
}

const T: Record<Lang, Translations> = { en, de }

interface I18nCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
}

const Ctx = createContext<I18nCtx>(null!)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  return <Ctx.Provider value={{ lang, setLang, t: T[lang] }}>{children}</Ctx.Provider>
}

export function useLang() {
  return useContext(Ctx)
}
