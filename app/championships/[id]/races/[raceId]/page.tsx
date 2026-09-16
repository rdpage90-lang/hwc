import { notFound } from "next/navigation";
import { getChampionshipFull } from "@/lib/championship";
import { auth } from "@/auth";
import { DriverAvatar, PositionMark, Badge } from "@/components/ui";
import { ResultEntryForm } from "@/components/ResultEntryForm";

export default async function RaceDetailPage({ params }: { params: { id: string; raceId: string } }) {
  const [championship, session] = await Promise.all([getChampionshipFull(params.id), auth()]);
  const race = championship.races.find((r) => r.id === params.raceId);
  if (!race) notFound();

  const isAdmin = session?.user.role === "ADMIN";

  const header = (
    <div className="mb-6">
      <div className="hud-tick mb-1">ROUND {String(race.roundNumber).padStart(2, "0")}</div>
      <h2 className="text-2xl text-white">{race.trackName}</h2>
      {race.raceDate && <div className="text-sm text-track-400 mt-1">{new Date(race.raceDate).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</div>}
    </div>
  );

  if (race.status === "UPCOMING") {
    return (
      <div>
        {header}
        <div className="hud-card p-8 text-center text-track-400">
          <Badge tone="neutral">Locked</Badge>
          <p className="mt-3 text-sm">This round opens once Round {race.roundNumber - 1} has been completed.</p>
        </div>
      </div>
    );
  }

  if (race.status === "OPEN") {
    const eligibleDrivers = championship.drivers
      .filter((cd) => cd.joinedRound <= race.roundNumber)
      .map((cd) => cd.driver);

    if (!isAdmin) {
      return (
        <div>
          {header}
          <div className="hud-card p-8 text-center text-track-400">
            <Badge tone="heat">Open</Badge>
            <p className="mt-3 text-sm">Results haven&apos;t been submitted for this round yet.</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        {header}
        <ResultEntryForm championshipId={championship.id} raceId={race.id} drivers={eligibleDrivers} />
      </div>
    );
  }

  // COMPLETED — permanent, read-only result page (spec section 22)
  const sorted = [...race.results].sort((a, b) => {
    const rank = (s: string) => (s === "FINISHED" ? 0 : s === "DNF" ? 1 : 2);
    if (rank(a.resultStatus) !== rank(b.resultStatus)) return rank(a.resultStatus) - rank(b.resultStatus);
    return (a.finishingPosition ?? 99) - (b.finishingPosition ?? 99);
  });

  return (
    <div>
      {header}
      <div className="hud-card divide-y divide-track-800">
        {sorted.map((r) => (
          <div key={r.id} className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-8 text-center">
              {r.resultStatus === "FINISHED" ? (
                <PositionMark position={r.finishingPosition} />
              ) : (
                <span className={`text-xs font-mono font-bold ${r.resultStatus === "DNF" ? "text-signal-red" : "text-track-500"}`}>
                  {r.resultStatus}
                </span>
              )}
            </div>
            <DriverAvatar name={r.driver.name} carColour={r.driver.carColour} avatarUrl={r.driver.avatarUrl} size={32} />
            <span className="flex-1 text-white">{r.driver.nickname || r.driver.name}</span>
            <span className="stat-figure text-white font-semibold">{r.championshipPoints} pts</span>
          </div>
        ))}
      </div>
      {race.submittedAt && (
        <p className="text-xs text-track-500 mt-3">
          Submitted {new Date(race.submittedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
