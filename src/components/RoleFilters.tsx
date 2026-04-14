import type { TeamInfo } from '../types'

interface Props {
  roles: TeamInfo[]
  onToggle: (roleName: string) => void
}

export default function RoleFilters({ roles, onToggle }: Props) {
  if (roles.length === 0) return null

  const allVisible = roles.every((r) => r.visible)
  const noneVisible = roles.every((r) => !r.visible)

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-gray-50 transition-colors border-b border-gray-100 mb-1">
        <input
          type="checkbox"
          checked={allVisible}
          ref={(el) => {
            if (el) el.indeterminate = !allVisible && !noneVisible
          }}
          onChange={() => onToggle('__all__')}
          className="sr-only"
        />
        <span
          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            allVisible ? 'bg-gray-600 border-gray-600' : 'border-gray-300 bg-white'
          }`}
        >
          {allVisible && (
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
              <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {!allVisible && !noneVisible && (
            <span className="w-2 h-0.5 bg-gray-400 rounded" />
          )}
        </span>
        <span className="text-sm text-gray-500 italic flex-1">Alles selecteren</span>
      </label>
      {roles.map((role) => (
        <label
          key={role.name}
          className="flex items-center gap-2 cursor-pointer group py-1 px-1 rounded hover:bg-gray-50 transition-colors"
        >
          <input
            type="checkbox"
            checked={role.visible}
            onChange={() => onToggle(role.name)}
            className="sr-only"
          />
          <span
            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              role.visible ? 'bg-gray-600 border-gray-600' : 'border-gray-300 bg-white'
            }`}
          >
            {role.visible && (
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
          <span className="text-sm text-gray-700 flex-1 truncate">{role.name}</span>
          <span className="text-xs text-gray-400 flex-shrink-0">{role.count}</span>
        </label>
      ))}
    </div>
  )
}
