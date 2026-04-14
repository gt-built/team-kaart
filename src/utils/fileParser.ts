import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { TeamMember } from '../types'

const REQUIRED_COLUMNS = [
  'Roepnaam voorvoegsel achternaam',
  'Straat',
  'Huisnr.',
  'Pstcd.',
  'Plaats',
  'Functie',
  'Team',
  'Categorie',
]

function normalizeRow(row: Record<string, string>): TeamMember | null {
  const name = (row['Roepnaam voorvoegsel achternaam'] || '').trim()
  const street = (row['Straat'] || '').trim()
  const houseNumber = (row['Huisnr.'] || '').trim()
  const postcode = (row['Pstcd.'] || '').trim()
  const city = (row['Plaats'] || '').trim()
  const role = (row['Functie'] || '').trim()
  const team = (row['Team'] || '').trim()
  const category = (row['Categorie'] || '').trim()

  if (!name || !postcode || !city) return null

  return {
    id: `${name}-${postcode}-${houseNumber}`.replace(/\s/g, '-'),
    name,
    street,
    houseNumber,
    postcode,
    city,
    role,
    team,
    category,
    geocoded: false,
  }
}

function checkColumns(headers: string[]): string[] {
  return REQUIRED_COLUMNS.filter((col) => !headers.includes(col))
}

export async function parseFile(file: File): Promise<{ members: TeamMember[]; errors: string[] }> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'csv') {
    return parseCSV(file)
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file)
  } else {
    return { members: [], errors: ['Ongeldig bestandsformaat. Gebruik .csv, .xlsx of .xls'] }
  }
}

async function parseCSV(file: File): Promise<{ members: TeamMember[]; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields || []
        const missing = checkColumns(headers)
        if (missing.length > 0) {
          resolve({
            members: [],
            errors: [`Ontbrekende kolommen: ${missing.join(', ')}`],
          })
          return
        }

        const errors: string[] = []
        const members: TeamMember[] = []
        ;(results.data as Record<string, string>[]).forEach((row, i) => {
          const member = normalizeRow(row)
          if (member) {
            members.push(member)
          } else {
            errors.push(`Rij ${i + 2}: onvoldoende data (naam/postcode/plaats vereist)`)
          }
        })

        resolve({ members, errors })
      },
      error(err) {
        resolve({ members: [], errors: [err.message] })
      },
    })
  })
}

async function parseExcel(file: File): Promise<{ members: TeamMember[]; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          defval: '',
          raw: false,
        })

        if (rows.length === 0) {
          resolve({ members: [], errors: ['Excel bestand is leeg'] })
          return
        }

        const headers = Object.keys(rows[0])
        const missing = checkColumns(headers)
        if (missing.length > 0) {
          resolve({
            members: [],
            errors: [`Ontbrekende kolommen: ${missing.join(', ')}`],
          })
          return
        }

        const errors: string[] = []
        const members: TeamMember[] = []
        rows.forEach((row, i) => {
          const member = normalizeRow(row)
          if (member) {
            members.push(member)
          } else {
            errors.push(`Rij ${i + 2}: onvoldoende data (naam/postcode/plaats vereist)`)
          }
        })

        resolve({ members, errors })
      } catch (err) {
        resolve({ members: [], errors: [`Excel leesout: ${String(err)}`] })
      }
    }
    reader.onerror = () => resolve({ members: [], errors: ['Bestand kon niet worden gelezen'] })
    reader.readAsArrayBuffer(file)
  })
}
