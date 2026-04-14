import FileUpload from './FileUpload'
import Stats from './Stats'
import TeamFilters from './TeamFilters'
import RoleFilters from './RoleFilters'
import type { TeamInfo, AppStats } from '../types'

interface Props {
  fileName: string
  isGeocoding: boolean
  geocodeProgress: { done: number; total: number }
  stats: AppStats
  teams: TeamInfo[]
  roles: TeamInfo[]
  errors: string[]
  onFileLoad: (file: File) => void
  onTeamToggle: (teamName: string) => void
  onRoleToggle: (roleName: string) => void
}

export default function Sidebar({
  fileName,
  isGeocoding,
  geocodeProgress,
  stats,
  teams,
  roles,
  errors,
  onFileLoad,
  onTeamToggle,
  onRoleToggle,
}: Props) {
  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0 shadow-sm">
      <div className="p-4 space-y-5">
        {/* Upload */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Bestand uploaden
          </h2>
          <FileUpload
            onFileLoad={onFileLoad}
            isGeocoding={isGeocoding}
            geocodeProgress={geocodeProgress}
            fileName={fileName}
          />
        </section>

        {/* Errors */}
        {errors.length > 0 && (
          <section>
            {errors.map((err, i) => (
              <div
                key={i}
                className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 mb-1"
              >
                {err}
              </div>
            ))}
          </section>
        )}

        {/* Stats */}
        {stats.totalPersons > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Statistieken
            </h2>
            <Stats stats={stats} />
            {stats.totalPersons > stats.placedOnMap && (
              <p className="text-xs text-amber-600 mt-2">
                {stats.totalPersons - stats.placedOnMap} adressen niet gevonden
              </p>
            )}
          </section>
        )}

        {/* Teams */}
        {teams.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Teams ({teams.length})
            </h2>
            <TeamFilters teams={teams} onToggle={onTeamToggle} />
          </section>
        )}

        {/* Rollen */}
        {roles.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Rollen ({roles.length})
            </h2>
            <RoleFilters roles={roles} onToggle={onRoleToggle} />
          </section>
        )}

        {/* Empty state hint */}
        {stats.totalPersons === 0 && !isGeocoding && errors.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-sm">Upload een CSV of Excel bestand om te beginnen</p>
            <p className="text-xs mt-1 text-gray-300">
              Vereiste kolommen: naam, straat, huisnr, postcode, plaats, functie, team, categorie
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
