import Link from "next/link";
import { getChampionshipFull } from "@/lib/championship";
import { computeStandings } from "@/lib/scoring";
import { DriverAvatar } from "@/components/ui";

export default async function StandingsPage({ params }: { params: { id: string } }) {
  const championship = await getChampionshipFull(params.id);
  const standings = computeStandings(championship);
  const rounds = Array.from({ length: championship.numberOfRaces }, (_, i) => i + 1);

  return (
    <div className="hud-card overflow-x-auto telemetry-scroll">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="border-b border-track-700">
            <Th className="text-left pl-4">Pos</Th>
            <Th className="text-left">Driver</Th>
            {rounds.map((r) => (
              <Th key={r} className="text-center w-10">
                R{r}
              </Th>
            ))}
            <Th className="text-right">Pts</Th>
            <Th className="text-right">Wins</Th>
            <Th className="text-right">Podiums</Th>
            <Th className="text-right pr-4">Avg</Th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr key={row.driverId} className="border-b border-track-800 hover:bg-track-800/40 transition-colors">
              <td className="pl-4 py-3 stat-figure text-track-300">{row.position}</td>
              <td className="py-3">
                <Link href={`/championships/${championship.id}/drivers/${row.driverId}`} className="flex items-center gap-2.5 group">
                  <DriverAvatar name={row.driver.name} carColour={row.driver.carColour} avatarUrl={row.driver.avatarUrl} size={26} />
                  <span className="text-white group-hover:text-heat-bright transition-colors whitespace-nowrap">
                    {row.driver.nickname || row.driver.name}
                  </span>
                </Link>
              </td>
              {row.perRound.map((cell, i) => (
                <td key={i} className="text-center py-3 stat-figure">
                  <RoundCell cell={cell} />
                </td>
              ))}
              <td className="text-right py-3 stat-figure text-white font-semibold">{row.points}</td>
              <td className="text-right py-3 stat-figure text-track-300">{row.wins}</td>
              <td className="text-right py-3 stat-figure text-track-300">{row.podiums}</td>
              <td className="text-right pr-4 py-3 stat-figure text-track-300">{row.avgFinish ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`hud-tick py-3 font-medium ${className ?? ""}`}>{children}</th>;
}

// Per-round cells show points scored that round (spec section 21's worked
// example sums each row's R1..R8 cells straight into the Pts column) —
// finishing position for a given round is one click away on the race's
// own result page or the driver's race history.
function RoundCell({ cell }: { cell: { kind: string; status?: string; points?: number } | null }) {
  if (!cell) return <span className="text-track-600">·</span>;
  if (cell.kind === "not-joined") return <span className="text-track-700">—</span>;
  if (cell.status === "DNF") return <span className="text-signal-red">DNF</span>;
  if (cell.status === "DNS") return <span className="text-track-500">DNS</span>;
  return <span className="text-track-200">{cell.points}</span>;
}
