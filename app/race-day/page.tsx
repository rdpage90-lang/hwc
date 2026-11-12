import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getChampionshipFull } from "@/lib/championship";
import { computeStandings } from "@/lib/scoring";
import { Card, Button, EmptyState, DriverAvatar } from "@/components/ui";

export default async function RaceDayPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  // Every round currently waiting for results. Usually just one.
  const openRaces = await db.race.findMany({
    where: { status: "OPEN", championship: { status: "ACTIVE" } },
    select: { id: true, championshipId: true },
    orderBy: [{ championship: { year: "desc" } }, { championship: { createdAt: "desc" } }],
  });

  const cards = await Promise.all(
    openRaces.map(async (open) => {
      const championship = await getChampionshipFull(open.championshipId);
      const race = championship.races.find((r) => r.id === open.id);
      return race ? { championship, race, standings: computeStandings(championship) } : null;
    }),
  );
  const raceCards = cards.filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-16 space-y-6">
      <div>
        <div className="hud-tick mb-1">Race day</div>
        <h1 className="text-2xl">Ready to race</h1>
      </div>

      {raceCards.length === 0 ? (
        <EmptyState
          title="No race is open"
          body="When a championship has a round waiting for results, it shows up here."
        />
      ) : (
        raceCards.map(({ championship, race, standings }) => {
          const top = standings.slice(0, 3);
          const anyPoints = (top[0]?.points ?? 0) > 0;

          return (
            <Card key={race.id}>
              <div className="hud-tick mb-1">{championship.name}</div>
              <div className="hud-tick text-heat mb-2">
                Round {String(race.roundNumber).padStart(2, "0")} of {championship.numberOfRaces}
              </div>
              <h2 className="text-3xl font-display font-bold text-white tracking-tightish mb-5">{race.trackName}</h2>

              <div className="mb-5">
                <div className="hud-tick mb-2">Championship before the race</div>
                {anyPoints ? (
                  <div className="space-y-1.5">
                    {top.map((row) => (
                      <div key={row.driverId} className="flex items-center gap-3">
                        <span className="w-5 stat-figure text-track-400 text-sm">{row.position}</span>
                        <DriverAvatar name={row.driver.name} carColour={row.driver.carColour} avatarUrl={row.driver.avatarUrl} size={28} />
                        <span className="flex-1 text-sm text-white truncate">{row.driver.nickname || row.driver.name}</span>
                        <span className="stat-figure text-white font-semibold">{row.points}</span>
                        <span className="hud-tick w-10 text-right">PTS</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-track-400">Season opener — no points on the board yet.</p>
                )}
              </div>

              {isAdmin ? (
                <Button href={`/race-day/${championship.id}/${race.id}`}>Enter results</Button>
              ) : (
                <p className="text-xs text-track-500">Waiting for the admin to submit the results.</p>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
