import type { TeamMember } from '../types'

const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`

export async function fetchMembers(): Promise<TeamMember[]> {
  const res = await fetch(`${BASE}/members`)
  if (!res.ok) throw new Error('Laden mislukt')
  return (await res.json()).map(fromApi)
}

export async function importMembers(members: TeamMember[]): Promise<TeamMember[]> {
  const res = await fetch(`${BASE}/members/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(members.map(toApi)),
  })
  if (!res.ok) throw new Error('Opslaan mislukt')
  return (await res.json()).map(fromApi)
}

export async function updateMember(id: string, fields: Partial<TeamMember>): Promise<TeamMember> {
  const res = await fetch(`${BASE}/members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiUpdate(fields)),
  })
  if (!res.ok) throw new Error('Bijwerken mislukt')
  return fromApi(await res.json())
}

export async function deleteMember(id: string): Promise<void> {
  const res = await fetch(`${BASE}/members/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Verwijderen mislukt')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromApi(d: any): TeamMember {
  return {
    id: d.id,
    name: d.name,
    street: d.street,
    houseNumber: d.house_number,
    postcode: d.postcode,
    city: d.city,
    role: d.role,
    team: d.team,
    category: d.category,
    lat: d.lat ?? undefined,
    lng: d.lng ?? undefined,
    geocoded: d.geocoded,
  }
}

function toApi(m: TeamMember) {
  return {
    name: m.name,
    street: m.street,
    house_number: m.houseNumber,
    postcode: m.postcode,
    city: m.city,
    role: m.role,
    team: m.team,
    category: m.category,
    lat: m.lat ?? null,
    lng: m.lng ?? null,
    geocoded: m.geocoded,
  }
}

function toApiUpdate(fields: Partial<TeamMember>) {
  const result: Record<string, unknown> = {}
  if (fields.name !== undefined) result.name = fields.name
  if (fields.street !== undefined) result.street = fields.street
  if (fields.houseNumber !== undefined) result.house_number = fields.houseNumber
  if (fields.postcode !== undefined) result.postcode = fields.postcode
  if (fields.city !== undefined) result.city = fields.city
  if (fields.role !== undefined) result.role = fields.role
  if (fields.team !== undefined) result.team = fields.team
  if (fields.category !== undefined) result.category = fields.category
  return result
}
