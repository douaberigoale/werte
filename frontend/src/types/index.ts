export interface BloodTestItem {
  name: string
  description: string | null
  unit: string
  normal_min: number | null
  normal_max: number | null
}

export interface BloodTestResult {
  blood_test_item_name: string
  blood_test_item?: BloodTestItem
  date: string // DD.MM.YYYY
  value: number
}

export interface Medication {
  name: string
  description: string | null
}

export interface MedicationIntake {
  medication_name: string
  medication?: Medication
  daily_dose: number
  start_date: string // DD.MM.YYYY
  end_date: string | null // DD.MM.YYYY or null (ongoing)
}

export interface Event {
  name: string
  date: string // DD.MM.YYYY
}

export interface BloodTestGroup {
  name: string
  sort_order: number
  items: BloodTestItem[]
}
