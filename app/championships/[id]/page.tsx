import Link from "next/link";
import { getChampionshipFull } from "@/lib/championship";
import { computeStandings, computeConstructorStandings } from "@/lib/scoring";
import { auth } from "@/auth";
import { Card, DriverAvatar, PositionMark, Button } from "@/components/ui";
import { ChampionshipProgress } from "@/components/ChampionshipProgress";
import { TeamManagement } from "@/components/TeamManagement";
import { TeamTag } from "@/components/TeamTag";
import { getTeamByDriverId } from "@/lib/championship-teams";

export default async function ChampionshipOverviewPage({ params }: { params: { id: string } }) {
  const [championship, session] = await Promise.all([getChampionshipFull(params.id), auth()]);
  const isAdmin = session?.user.role === "ADMIN";
  const standings = computeStandings(championship);
  const constructorStandings = computeConstructorStandings(championship);
  const teamByDriverId = getTeamByDriverId(championship);

  // Constructors' champion (V2 spec section 14): the top of the final
  // constructors' standings once the championship is completed. Derived, not
  // stored — safe because results are immutable and team assignments are now
  // locked at completion, so these inputs can never change afterwards.
  const topConstructor = constructorStandings[0];
  const constructorsChampion =
    championship.status === "COMPLETED" && topConstructor && topConstructor.points > 0 ? topConstructor : null;
  const constructorsChampionDriverNames = constructorsChampion
    ? championship.driverTeams
        .filter((dt) => dt.teamId === constructorsChampion.teamId)
        .map((dt) => championship.drivers.find((d) => d.driverId === dt.driverId)?.driver)
        .filter((d): d is NonNullable<typeof d> => !!d)
        .map((d) => d.nickname || d.name)
    : [];

  const leader = standings[0];
  const nextRace = championship.races.find((r) => r.status === "OPEN");
  const lastRace = [...championship.races].reverse().find((r) => r.status === "COMPLETED");
  const lastRaceResults = lastRace
    ? [...lastRace.results].sort((a, b) => {
        const rank = (s: string) => (s === "FINISHED" ? 0 : s === "DNF" ? 1 : 2);
        if (rank(a.resultStatus) !== rank(b.resultStatus)) return rank(a.resultStatus) - rank(b.resultStatus);
        return (a.finishingPosition ?? 99) - (b.finishingPosition ?? 99);
      })
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <ChampionshipProgress races={championship.races} />
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {leader && (
          <Card>
            <div className="hud-tick mb-3">{championship.status === "COMPLETED" ? "World champion" : "Current leader"}</div>
            <Link href={`/championships/${championship.id}/drivers/${leader.driverId}`} className="flex items-center gap-4 group">
              <DriverAvatar name={leader.driver.name} carColour={leader.driver.carColour} avatarUrl={leader.driver.avatarUrl} size={56} />
              <div>
                <div className="text-xl text-white font-display font-semibold group-hover:text-heat-bright transition-colors">
                  {leader.driver.nickname || leader.driver.name}
                </div>
                <div className="stat-figure text-track-300 text-sm mt-0.5">
                  {leader.points} PTS · {leader.wins} wins · {leader.podiums} podiums
                </div>
              </div>
            </Link>
          </Card>
        )}

        {nextRace ? (
          <Card>
            <div className="hud-tick mb-3">Next race</div>
            <div className="text-xl text-white font-display font-semibold">{nextRace.trackName}</div>
            <div className="text-sm text-track-400 mt-0.5">Round {nextRace.roundNumber} of {championship.numberOfRaces}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href={`/championships/${championship.id}/races/${nextRace.id}`} size="sm">
                Enter results
              </Button>
              <Button href="/race-day" variant="secondary" size="sm">
                Race Day
              </Button>
            </div>
          </Card>
        ) : (
          lastRace && (
            <Card>
              <div className="hud-tick mb-3">Recent result</div>
              <div className="text-white font-display font-semibold text-lg mb-3">{lastRace.trackName}</div>
              <div className="space-y-1.5">
                {lastRaceResults.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <PositionMark position={r.finishingPosition} />
                    <DriverAvatar name={r.driver.name} carColour={r.driver.carColour} avatarUrl={r.driver.avatarUrl} size={24} />
                    <span className="text-sm text-white">{r.driver.nickname || r.driver.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          )
        )}
      </div>

      {constructorsChampion && (
        <Card>
          <div className="hud-tick mb-3">Constructors&apos; champion</div>
          <div className="flex items-center gap-4">
            <span
              className="w-4 h-4 rounded-full shrink-0 border border-track-600"
              style={{ backgroundColor: constructorsChampion.team.colour.toLowerCase() }}
              aria-hidden
            />
            <div>
              <div className="text-xl text-white font-display font-semibold">{constructorsChampion.team.name}</div>
              <div className="stat-figure text-track-300 text-sm mt-0.5">
                {constructorsChampion.points} PTS · {constructorsChampion.wins} wins · {constructorsChampion.podiums} podiums
              </div>
              {constructorsChampionDriverNames.length > 0 && (
                <div className="text-xs text-track-500 mt-1">{constructorsChampionDriverNames.join(" · ")}</div>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg">Standings</h2>
          <div className="flex items-center gap-4">
            <Link href={`/championships/${championship.id}/progression`} className="text-xs text-heat hover:text-heat-bright font-mono uppercase tracking-wideish">
              Progression →
            </Link>
            <Link href={`/championships/${championship.id}/standings`} className="text-xs text-heat hover:text-heat-bright font-mono uppercase tracking-wideish">
              Full table →
            </Link>
          </div>
        </div>
        <div className="space-y-1">
          {standings.slice(0, 8).map((row) => (
            <Link
              key={row.driverId}
              href={`/championships/${championship.id}/drivers/${row.driverId}`}
              className="flex items-center gap-3 py-2 px-2 -mx-2 hover:bg-track-800/60 transition-colors"
            >
              <span className="w-5 stat-figure text-track-400 text-sm">{row.position}</span>
              <DriverAvatar name={row.driver.name} carColour={row.driver.carColour} avatarUrl={row.driver.avatarUrl} size={28} />
              <span className="flex-1 text-sm text-white truncate">{row.driver.nickname || row.driver.name}</span>
              {teamByDriverId.get(row.driverId) && <TeamTag team={teamByDriverId.get(row.driverId)!} className="shrink-0" />}
              <span className="stat-figure text-white font-semibold">{row.points}</span>
              <span className="hud-tick w-10 text-right">PTS</span>
            </Link>
          ))}
        </div>
      </Card>

      {constructorStandings.length > 0 && (
        <Card>
          <h2 className="text-lg mb-4">Constructors&apos; standings</h2>
          <div className="space-y-1">
            {constructorStandings.map((row) => (
              <div key={row.teamId} className="flex items-center gap-3 py-2 px-2 -mx-2">
                <span className="w-5 stat-figure text-track-400 text-sm">{row.position}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-track-600"
                  style={{ backgroundColor: row.team.colour.toLowerCase() }}
                  aria-hidden
                />
                <span className="flex-1 text-sm text-white truncate">
                  {row.team.name} <span className="text-track-500">({row.team.abbreviation})</span>
                </span>
                <span className="text-xs text-track-400">{row.wins} win{row.wins === 1 ? "" : "s"}</span>
                <span className="stat-figure text-white font-semibold">{row.points}</span>
                <span className="hud-tick w-10 text-right">PTS</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Team assignments are part of a completed championship's permanent record (V2 spec section 41), so editing stops at completion. */}
      <TeamManagement championshipId={championship.id} isAdmin={!!isAdmin && championship.status !== "COMPLETED"} />
    </div>
  );
}
