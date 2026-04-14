import { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import MapView from './components/Map'
import MemberTable from './components/MemberTable'
import type { TeamMember, TeamInfo, AppStats } from './types'
import { geocodePostcode } from './utils/geocoding'
import { parseFile } from './utils/fileParser'
import { getTeamColorHex } from './utils/colors'
import { fetchMembers, importMembers } from './utils/api'

type View = 'map' | 'table'

// --- helpers ----------------------------------------------------------------

function buildTeamsFrom(list: TeamMember[], prev: TeamInfo[]): TeamInfo[] {
  const map = new Map<string, number>()
  list.forEach((m) => m.team && map.set(m.team, (map.get(m.team) || 0) + 1))
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({
      name,
      color: getTeamColorHex(name),
      count,
      visible: prev.find((t) => t.name === name)?.visible ?? true,
    }))
}

function buildRolesFrom(list: TeamMember[], prev: TeamInfo[]): TeamInfo[] {
  const map = new Map<string, number>()
  list.forEach((m) => m.role && map.set(m.role, (map.get(m.role) || 0) + 1))
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({
      name,
      color: '#6b7280',
      count,
      visible: prev.find((r) => r.name === name)?.visible ?? true,
    }))
}

// ---------------------------------------------------------------------------

export default function App() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [teams, setTeams] = useState<TeamInfo[]>([])
  const [roles, setRoles] = useState<TeamInfo[]>([])
  const [stats, setStats] = useState<AppStats>({
    totalPersons: 0,
    placedOnMap: 0,
    teamCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
  })
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodeProgress, setGeocodeProgress] = useState({ done: 0, total: 0 })
  const [errors, setErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [view, setView] = useState<View>('map')
  const [dbReady, setDbReady] = useState(false)

  // Populate all state from a member list (fresh import or initial load)
  const applyMembers = useCallback(
    (list: TeamMember[], extra: { cacheHits?: number; cacheMisses?: number } = {}) => {
      const teamInfos = buildTeamsFrom(list, [])
      const roleInfos = buildRolesFrom(list, [])
      setMembers(list)
      setTeams(teamInfos)
      setRoles(roleInfos)
      setStats({
        totalPersons: list.length,
        placedOnMap: list.filter((m) => m.geocoded).length,
        teamCount: teamInfos.length,
        cacheHits: extra.cacheHits ?? 0,
        cacheMisses: extra.cacheMisses ?? 0,
      })
    },
    []
  )

  // Load from backend on mount, fall back to localStorage
  useEffect(() => {
    fetchMembers()
      .then((list) => { if (list.length > 0) applyMembers(list) })
      .catch(() => {
        const raw = localStorage.getItem('team-kaart-members')
        if (raw) {
          try { applyMembers(JSON.parse(raw)) } catch { /* corrupt data */ }
        }
      })
      .finally(() => setDbReady(true))
  }, [applyMembers])

  const handleFileLoad = useCallback(
    async (file: File) => {
      setErrors([])
      setFileName(file.name)
      setMembers([])
      setTeams([])
      setRoles([])

      const { members: parsed, errors: parseErrors } = await parseFile(file)
      if (parseErrors.length > 0 && parsed.length === 0) { setErrors(parseErrors); return }
      if (parseErrors.length > 0) setErrors(parseErrors)

      setIsGeocoding(true)
      setGeocodeProgress({ done: 0, total: parsed.length })

      let cacheHits = 0
      let cacheMisses = 0
      const geocoded: TeamMember[] = []

      for (let i = 0; i < parsed.length; i++) {
        const member = parsed[i]
        const result = await geocodePostcode(member.postcode, member.city)
        if (result) {
          if (result.fromCache) cacheHits++
          else cacheMisses++
          geocoded.push({ ...member, lat: result.lat, lng: result.lng, geocoded: true })
        } else {
          geocoded.push(member)
        }
        setGeocodeProgress({ done: i + 1, total: parsed.length })
      }

      setIsGeocoding(false)

      try {
        const saved = await importMembers(geocoded)
        localStorage.setItem('team-kaart-members', JSON.stringify(saved))
        applyMembers(saved, { cacheHits, cacheMisses })
      } catch {
        localStorage.setItem('team-kaart-members', JSON.stringify(geocoded))
        applyMembers(geocoded, { cacheHits, cacheMisses })
      }
    },
    [applyMembers]
  )

  const handleTeamToggle = useCallback((teamName: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.name === teamName ? { ...t, visible: !t.visible } : t))
    )
  }, [])

  const handleRoleToggle = useCallback((roleName: string) => {
    if (roleName === '__all__') {
      setRoles((prev) => {
        const allVisible = prev.every((r) => r.visible)
        return prev.map((r) => ({ ...r, visible: !allVisible }))
      })
    } else {
      setRoles((prev) =>
        prev.map((r) => (r.name === roleName ? { ...r, visible: !r.visible } : r))
      )
    }
  }, [])

  // Update a single member (called after successful API PUT)
  const handleUpdate = useCallback(
    (updated: TeamMember) => {
      const next = members.map((m) => (m.id === updated.id ? updated : m))
      setMembers(next)
      setTeams(buildTeamsFrom(next, teams))
      setRoles(buildRolesFrom(next, roles))
      setStats((prev) => ({
        ...prev,
        placedOnMap: next.filter((m) => m.geocoded).length,
      }))
    },
    [members, teams, roles]
  )

  // Delete a single member (called after successful API DELETE)
  const handleDelete = useCallback(
    (id: string) => {
      const next = members.filter((m) => m.id !== id)
      setMembers(next)
      setTeams(buildTeamsFrom(next, teams))
      setRoles(buildRolesFrom(next, roles))
      setStats((prev) => ({
        ...prev,
        totalPersons: next.length,
        placedOnMap: next.filter((m) => m.geocoded).length,
        teamCount: buildTeamsFrom(next, teams).length,
      }))
    },
    [members, teams, roles]
  )

  const visibleMembers = members.filter((m) => {
    const team = teams.find((t) => t.name === m.team)
    const role = roles.find((r) => r.name === m.role)
    return team?.visible !== false && role?.visible !== false
  })

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-3 flex items-center gap-4 shadow-md flex-shrink-0">
        <span className="text-2xl">🗺️</span>
        <h1 className="text-lg font-semibold tracking-tight">Team Kaart — Move Beyond</h1>

        {members.length > 0 && (
          <div className="ml-auto flex bg-gray-800 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView('map')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'map' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              Kaart
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'table' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              Leden
            </button>
          </div>
        )}
      </header>

      {!dbReady && (
        <div className="text-xs text-center py-1 bg-blue-50 text-blue-500 flex-shrink-0">
          Database laden…
        </div>
      )}

      {/* Body — min-h-0 forces flex children to respect the container height */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          fileName={fileName}
          isGeocoding={isGeocoding}
          geocodeProgress={geocodeProgress}
          stats={stats}
          teams={teams}
          roles={roles}
          errors={errors}
          onFileLoad={handleFileLoad}
          onTeamToggle={handleTeamToggle}
          onRoleToggle={handleRoleToggle}
        />
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {view === 'map' ? (
            <MapView members={visibleMembers} teams={teams} />
          ) : (
            <MemberTable
              members={visibleMembers}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          )}
        </main>
      </div>
    </div>
  )
}
