import type { AppStats } from '../types'

interface Props {
  stats: AppStats
}

function StatBox({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function Stats({ stats }: Props) {
  if (stats.totalPersons === 0) return null

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Personen" value={stats.totalPersons} />
        <StatBox label="Op kaart" value={stats.placedOnMap} />
        <StatBox label="Teams" value={stats.teamCount} />
        <StatBox
          label="Cache hits"
          value={stats.cacheHits}
          sub={`${stats.cacheMisses} nieuwe lookups`}
        />
      </div>
    </div>
  )
}
