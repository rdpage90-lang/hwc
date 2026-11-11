import { notFound, redirect } from "next/navigation";
import { getChampionshipFull } from "@/lib/championship";
import { getRaceStatistics } from "@/lib/race-stats";
import { getRaceImpact, getRaceReport } from "@/lib/race-report";
import { Card, Button, DriverAvatar } from "@/components/ui";
import { RaceReportCard } from "@/components/RaceReportCard";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function RaceDayResultPage({ params }: { params: { id: string; raceId: string } }) {
  const championship = await getChampionshipFull(params.id);
  const race = championship.races.find((r) => r.id === params.raceId);
  if (!race) notFound();

  // The celebration only exists once the result is in.
  if (race.status !== "COMPLETED") redirect("/race-day");

  const stats = getRaceStatistics(race.results);
  const impact = getRaceImpact(championship, race);
  const report = getRaceReport(championship, race);

  const resultByDriverId = new Map(race.results.map((r) => [r.driverId, r]));

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-16 space-y-6">
      <div className="text-center">
        <div className="hud-tick mb-2">🏁 Race complete</div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tightish">{race.trackName}</h1>
        <div className="hud-tick mt-2">
          Round {String(race.roundNumber).padStart(2, "0")} · {championship.name}
        </div>
      </div>

      <Card>
        <div className="hud-tick mb-3">Podium</div>
        {stats.podium.length === 0 ? (
          <p className="text-sm text-track-400">No classified finishers.</p>
        ) : (
          <div className="space-y-3">
            {stats.podium.map((p) => {
              const result = resultByDriverId.get(p.driverId);
              if (!result) return null;
              return (
                <div key={p.driverId} className="flex items-center gap-4">
                  <span className="text-3xl w-10 text-center shrink-0">{MEDALS[p.position - 1]}</span>
                  <DriverAvatar name={result.driver.name} carColour={result.driver.carColour} avatarUrl={result.driver.avatarUrl} size={44} />
                  <span className={`flex-1 truncate ${p.position === 1 ? "text-xl text-white font-display font-semibold" : "text-base text-white"}`}>
                    {p.name}
                  </span>
                  <span className="stat-figure text-track-300">+{result.championshipPoints} pts</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {impact.leader && (
        <Card>
          <div className="hud-tick mb-3">Championship leader</div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xl text-white font-display font-semibold">{impact.leader.name}</div>
              <div className="text-xs text-track-500 mt-0.5">
                {impact.leader.points} pts
                {impact.remainingRounds > 0
                  ? ` · ${impact.remainingRounds} race${impact.remainingRounds === 1 ? "" : "s"} to go`
                  : " · final round"}
              </div>
            </div>
            {impact.gap != null && impact.secondName && (
              <div className="text-right">
                <div className="stat-figure text-heat text-2xl font-bold">+{impact.gap}</div>
                <div className="hud-tick mt-0.5">on {impact.secondName}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {report && <RaceReportCard report={report} />}

      <div className="flex flex-wrap gap-3">
        <Button href={`/championships/${championship.id}/standings`}>View standings</Button>
        <Button href={`/championships/${championship.id}/races/${race.id}`} variant="secondary">
          Full race result
        </Button>
      </div>
    </div>
  );
}
