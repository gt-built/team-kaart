import type { TeamInfo } from '../types'

interface Props {
  teams: TeamInfo[]
  onToggle: (teamName: string) => void
}

export default function TeamFilters({ teams, onToggle }: Props) {
  if (teams.length === 0) return null

  return (
    <div className="space-y-1">
      {teams.map((team) => (
        <label
          key={team.name}
          className="flex items-center gap-2 cursor-pointer group py-1 px-1 rounded hover:bg-gray-50 transition-colors"
        >
          <input
            type="checkbox"
            checked={team.visible}
            onChange={() => onToggle(team.name)}
            className="sr-only"
          />
          <span
            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              team.visible ? 'border-transparent' : 'border-gray-300 bg-white'
            }`}
            style={team.visible ? { backgroundColor: team.color, borderColor: team.color } : {}}
          >
            {team.visible && (
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: team.color }}
          />
          <span className="text-sm text-gray-700 flex-1 truncate">{team.name}</span>
          <span className="text-xs text-gray-400 flex-shrink-0">{team.count}</span>
        </label>
      ))}
    </div>
  )
}
