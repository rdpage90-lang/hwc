import Link from "next/link";
import { Card } from "@/components/ui";
import type { RaceStatistics as RaceStatisticsData } from "@/lib/race-stats";

const MEDALS = ["🥇", "🥈", "🥉"];

export function RaceStatistics({ stats }: { stats: RaceStatisticsData }) {
  return (
    <Card>
      <h2 className="text-lg mb-4">Race statistics</h2>

      {stats.podium.length > 0 ? (
        <div className="space-y-1.5 mb-5">
          {stats.podium.map((p) => (
            <Link
              key={p.driverId}
              href={`/drivers/${p.driverId}`}
              className="flex items-center gap-3 py-1 hover:text-heat-bright transition-colors"
            >
              <span className="text-lg w-7 shrink-0">{MEDALS[p.position - 1]}</span>
              <span className="text-sm text-white">{p.name}</span>
              {p.position === 1 && <span className="hud-tick">Winner</span>}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-track-400 mb-5">No classified finishers in this race.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-track-800 border-t border-track-800 pt-4">
        <Stat label="Finishers" value={stats.finishers} />
        <Stat label="DNFs" value={stats.dnfs} />
        <Stat label="DNS" value={stats.dnsCount} />
        <Stat label="Points awarded" value={stats.totalPoints} />
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 py-1 text-center">
      <div className="stat-figure text-white text-lg font-semibold">{value}</div>
      <div className="hud-tick mt-1">{label}</div>
    </div>
  );
}
