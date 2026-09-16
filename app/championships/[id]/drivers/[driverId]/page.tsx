import { notFound } from "next/navigation";
import { getChampionshipFull } from "@/lib/championship";
import { computeStandings } from "@/lib/scoring";
import { DriverAvatar, StatCard, Badge } from "@/components/ui";

export default async function DriverProfilePage({ params }: { params: { id: string; driverId: string } }) {
  const championship = await getChampionshipFull(params.id);
  const membership = championship.drivers.find((cd) => cd.driverId === params.driverId);
  if (!membership) notFound();

  const standings = computeStandings(championship);
  const row = standings.find((s) => s.driverId === params.driverId);
  if (!row) notFound();

  const { driver } = membership;

  return (
    <div className="space-y-6">
      <div className="hud-card p-6 flex items-center gap-5">
        <DriverAvatar name={driver.name} carColour={driver.carColour} avatarUrl={driver.avatarUrl} size={64} />
        <div>
          <h2 className="text-2xl text-white">{driver.name}</h2>
          {driver.nickname && <div className="text-sm text-track-400">&ldquo;{driver.nickname}&rdquo;</div>}
          <div className="flex items-center gap-2 mt-2">
            <Badge tone="heat">P{row.position} in championship</Badge>
            {membership.joinedRound > 1 && <Badge tone="amber">Joined Round {membership.joinedRound}</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Points" value={row.points} />
        <StatCard label="Wins" value={row.wins} />
        <StatCard label="Podiums" value={row.podiums} />
        <StatCard label="Avg finish" value={row.avgFinish ?? "—"} />
        <StatCard label="Best finish" value={row.bestFinish ?? "—"} />
        <StatCard label="Starts" value={row.starts} />
        <StatCard label="DNFs" value={row.dnfs} />
        <StatCard label="DNS" value={row.dnsCount} />
      </div>

      <div>
        <h3 className="text-lg mb-3">Race history</h3>
        <div className="hud-card divide-y divide-track-800">
          {championship.races.map((race, i) => {
            const cell = row.perRound[i];
            return (
              <div key={race.id} className="flex items-center gap-4 px-4 py-3">
                <span className="hud-tick w-16 shrink-0">R{race.roundNumber}</span>
                <span className="flex-1 text-sm text-white truncate">{race.trackName}</span>
                <RaceHistoryCell cell={cell} raceStatus={race.status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RaceHistoryCell({
  cell,
  raceStatus,
}: {
  cell: { kind: string; status?: string; position?: number | null; points?: number } | null;
  raceStatus: string;
}) {
  if (!cell) {
    return <span className="text-xs text-track-500">{raceStatus === "COMPLETED" ? "—" : "Not yet raced"}</span>;
  }
  if (cell.kind === "not-joined") return <span className="text-xs text-track-600">Not yet joined</span>;
  if (cell.status === "DNF") return <span className="text-xs font-mono text-signal-red">DNF · 0 pts</span>;
  if (cell.status === "DNS") return <span className="text-xs font-mono text-track-500">DNS · 0 pts</span>;
  return (
    <span className="text-xs font-mono text-track-200">
      P{cell.position} · {cell.points} pts
    </span>
  );
}
