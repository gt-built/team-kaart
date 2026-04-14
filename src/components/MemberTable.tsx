import { useState } from 'react'
import type { TeamMember } from '../types'
import { updateMember, deleteMember } from '../utils/api'

interface Props {
  members: TeamMember[]
  onUpdate: (updated: TeamMember) => void
  onDelete: (id: string) => void
}

type EditForm = Pick<TeamMember, 'name' | 'role' | 'team' | 'category' | 'street' | 'houseNumber' | 'postcode' | 'city'>

const FIELDS: { key: keyof EditForm; label: string }[] = [
  { key: 'name', label: 'Naam' },
  { key: 'role', label: 'Functie' },
  { key: 'team', label: 'Team' },
  { key: 'category', label: 'Categorie' },
  { key: 'street', label: 'Straat' },
  { key: 'houseNumber', label: 'Huisnr.' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'city', label: 'Plaats' },
]

export default function MemberTable({ members, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const startEdit = (m: TeamMember) => {
    setEditingId(m.id)
    setEditForm({
      name: m.name,
      role: m.role,
      team: m.team,
      category: m.category,
      street: m.street,
      houseNumber: m.houseNumber,
      postcode: m.postcode,
      city: m.city,
    })
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const saveEdit = async (id: string) => {
    if (!editForm) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateMember(id, editForm)
      onUpdate(updated)
      setEditingId(null)
      setEditForm(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Weet je zeker dat je ${name} wilt verwijderen?`)) return
    try {
      await deleteMember(id)
      onDelete(id)
      if (editingId === id) cancelEdit()
    } catch (e) {
      setError(String(e))
    }
  }

  const filtered = search.trim()
    ? members.filter((m) =>
        [m.name, m.role, m.team, m.city, m.postcode].some((v) =>
          v.toLowerCase().includes(search.toLowerCase())
        )
      )
    : members

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p className="text-sm">Geen leden beschikbaar — upload eerst een bestand</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <input
          type="search"
          placeholder="Zoeken op naam, functie, team, plaats…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} van {members.length} leden
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-2 flex-shrink-0">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {FIELDS.map((f) => (
                <th
                  key={f.key}
                  className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 border-b border-gray-200 whitespace-nowrap"
                >
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2 border-b border-gray-200 w-32" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) =>
              editingId === m.id && editForm ? (
                <tr key={m.id} className="bg-blue-50">
                  {FIELDS.map((f) => (
                    <td key={f.key} className="px-2 py-1.5 border-b border-blue-100">
                      <input
                        value={editForm[f.key]}
                        onChange={(e) =>
                          setEditForm((prev) => prev && { ...prev, [f.key]: e.target.value })
                        }
                        className="w-full min-w-[64px] border border-blue-300 rounded px-1.5 py-0.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 border-b border-blue-100 whitespace-nowrap">
                    <button
                      onClick={() => saveEdit(m.id)}
                      disabled={saving}
                      className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-700 disabled:opacity-50 mr-1.5"
                    >
                      {saving ? '…' : 'Opslaan'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1 rounded hover:bg-gray-300"
                    >
                      Annuleren
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 border-b border-gray-100 font-medium text-gray-800 whitespace-nowrap">
                    {m.name}
                    {!m.geocoded && (
                      <span className="ml-1.5 text-[10px] text-amber-500 font-normal">niet op kaart</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b border-gray-100 text-gray-600 whitespace-nowrap">{m.role}</td>
                  <td className="px-3 py-2 border-b border-gray-100 text-gray-600 whitespace-nowrap">{m.team}</td>
                  <td className="px-3 py-2 border-b border-gray-100 text-gray-600">{m.category}</td>
                  <td className="px-3 py-2 border-b border-gray-100 text-gray-500">{m.street}</td>
                  <td className="px-3 py-2 border-b border-gray-100 text-gray-500">{m.houseNumber}</td>
                  <td className="px-3 py-2 border-b border-gray-100 text-gray-500">{m.postcode}</td>
                  <td className="px-3 py-2 border-b border-gray-100 text-gray-500">{m.city}</td>
                  <td className="px-3 py-2 border-b border-gray-100 whitespace-nowrap text-right pr-4">
                    <button
                      onClick={() => startEdit(m)}
                      className="text-xs text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, m.name)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Verwijderen
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
