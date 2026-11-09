import Link from "next/link";
import { getChampionshipFull } from "@/lib/championship";
import { computeStandings, computeConstructorStandings } from "@/lib/scoring";
import { getTeamByDriverId } from "@/lib/championship-teams";
import { DriverAvatar } from "@/components/ui";
import { TeamTag } from "@/components/TeamTag";

export default async function StandingsPage({ params }: { params: { id: string } }) {
  const championship = await getChampionshipFull(params.id);
  const standings = computeStandings(championship);
  const constructorStandings = computeConstructorStandings(championship);
  const teamByDriverId = getTeamByDriverId(championship);
  const hasTeams = championship.teams.length > 0;
  const rounds = Array.from({ length: championship.numberOfRaces }, (_, i) => i + 1);

  // Driver names per team, for the sub-line in the constructors' table.
  const driverNameById = new Map(championship.drivers.map((d) => [d.driverId, d.driver.nickname || d.driver.name]));
  const driverNamesByTeamId = new Map<string, string[]>();
  for (const assignment of championship.driverTeams) {
    const name = driverNameById.get(assignment.driverId);
    if (!name) continue;
    driverNamesByTeamId.set(assignment.teamId, [...(driverNamesByTeamId.get(assignment.teamId) ?? []), name]);
  }

  return (
    <div className="space-y-6">
      <div>
        {hasTeams && <h2 className="text-lg mb-3">Drivers&apos; standings</h2>}
        <div className="hud-card overflow-x-auto telemetry-scroll">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-track-700">
                <Th className="text-left pl-4">Pos</Th>
                <Th className="text-left">Driver</Th>
                {hasTeams && <Th className="text-left hidden md:table-cell">Team</Th>}
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
              {standings.map((row) => {
                const team = teamByDriverId.get(row.driverId);
                return (
                  <tr key={row.driverId} className="border-b border-track-800 hover:bg-track-800/40 transition-colors">
                    <td className="pl-4 py-3 stat-figure text-track-300">{row.position}</td>
                    <td className="py-3">
                      <Link href={`/championships/${championship.id}/drivers/${row.driverId}`} className="flex items-center gap-2.5 group">
                        <DriverAvatar name={row.driver.name} carColour={row.driver.carColour} avatarUrl={row.driver.avatarUrl} size={26} />
                        <div className="min-w-0">
                          <span className="block text-white group-hover:text-heat-bright transition-colors whitespace-nowrap">
                            {row.driver.nickname || row.driver.name}
                          </span>
                          {/* On narrow screens the Team column is hidden, so the team sits under the name instead. */}
                          {team && <TeamTag team={team} className="md:hidden" />}
                        </div>
                      </Link>
                    </td>
                    {hasTeams && (
                      <td className="py-3 hidden md:table-cell">
                        {team ? <TeamTag team={team} /> : <span className="text-track-600">—</span>}
                      </td>
                    )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {constructorStandings.length > 0 && (
        <div>
          <h2 className="text-lg mb-3">Constructors&apos; standings</h2>
          <div className="hud-card overflow-x-auto telemetry-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-track-700">
                  <Th className="text-left pl-4">Pos</Th>
                  <Th className="text-left">Team</Th>
                  <Th className="text-right">Pts</Th>
                  <Th className="text-right">Wins</Th>
                  <Th className="text-right pr-4">Podiums</Th>
                </tr>
              </thead>
              <tbody>
                {constructorStandings.map((row) => {
                  const driverNames = driverNamesByTeamId.get(row.teamId) ?? [];
                  return (
                    <tr key={row.teamId} className="border-b border-track-800 hover:bg-track-800/40 transition-colors">
                      <td className="pl-4 py-3 stat-figure text-track-300">{row.position}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-track-600"
                            style={{ backgroundColor: row.team.colour.toLowerCase() }}
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <div className="text-white whitespace-nowrap">
                              {row.team.name} <span className="text-track-500">({row.team.abbreviation})</span>
                            </div>
                            {driverNames.length > 0 && <div className="text-xs text-track-500">{driverNames.join(", ")}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 stat-figure text-white font-semibold">{row.points}</td>
                      <td className="text-right py-3 stat-figure text-track-300">{row.wins}</td>
                      <td className="text-right pr-4 py-3 stat-figure text-track-300">{row.podiums}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
