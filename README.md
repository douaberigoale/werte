# Werte

A client-side web app for tracking blood test results and medication intakes over time.

All data is stored locally in the browser (localStorage) — nothing is sent to a server.

## Features

- **Types** — define blood test parameters with unit and normal range
- **Results** — log values per type and date, with filtering and grouping
- **Medications** — track medications and daily intake periods
- **Groups** — organise types into named subsets for separate charts
- **Events** — mark significant dates shown as reference lines on charts
- **Charts** — normalised time-series view with zoom/pan; medication doses on a second axis
- **XLSX import/export** — back up and restore all data as a spreadsheet

## Running locally

```bash
docker compose up -d
```
or
```bash
cd frontend
npm install
npm run dev
```

## Data format (XLSX)

The exported file contains one sheet per entity:

| Sheet | Primary key columns |
|---|---|
| `types` | `name` |
| `results` | `blood_test_item_name`, `date` |
| `medications` | `name` |
| `intake` | `medication_name`, `start_date` |
| `groups` | `name` |
| `group_items` | `group_name`, `item_name` |
| `events` | `name`, `date` |

Dates are stored as `DD.MM.YYYY`.
