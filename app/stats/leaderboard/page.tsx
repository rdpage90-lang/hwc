import Link from "next/link";
import { getCareerLeaderboard } from "@/lib/career";
import { DriverAvatar, Badge, EmptyState } from "@/components/ui";

export default async function CareerLeaderboardPage() {
  const rows = await getCareerLeaderboard();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">All-time standings</h1>
        <p className="text-sm text-track-400 mt-1">Every driver who's ever taken the grid, ranked by career points.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No results yet" body="Career standings appear once races have been completed." />
      ) : (
        <div className="hud-card divide-y divide-track-800">
          {rows.map((row) => (
            <Link
              key={row.driverId}
              href={`/drivers/${row.driverId}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-track-800/40 transition-colors"
            >
              <span className="w-6 stat-figure text-track-400 text-sm">{row.position}</span>
              <DriverAvatar name={row.driver.name} carColour={row.driver.carColour} avatarUrl={row.driver.avatarUrl} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white truncate">{row.driver.nickname || row.driver.name}</span>
                  {row.driver.driverNumber != null && (
                    <span className="hud-tick shrink-0">#{String(row.driver.driverNumber).padStart(2, "0")}</span>
                  )}
                </div>
                <div className="text-xs text-track-500 mt-0.5">
                  {row.wins} win{row.wins === 1 ? "" : "s"} · {row.podiums} podium{row.podiums === 1 ? "" : "s"}
                </div>
              </div>
              {row.championshipsWon > 0 && <Badge tone="volt">{row.championshipsWon}x champion</Badge>}
              <span className="stat-figure text-white font-semibold">{row.points}</span>
              <span className="hud-tick w-10 text-right">PTS</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
