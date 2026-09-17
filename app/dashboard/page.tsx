import Link from "next/link";
import { db } from "@/lib/db";
import { getChampionshipFull } from "@/lib/championship";
import { computeStandings } from "@/lib/scoring";
import { Card, Button, EmptyState, DriverAvatar, PositionMark } from "@/components/ui";
import { auth } from "@/auth";
import { ChampionshipProgress } from "@/components/ChampionshipProgress";

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const activeChampionships = await db.championship.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (activeChampionships.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-10 space-y-6">
        <EmptyState
          title="No championship in progress"
          body={
            isAdmin
              ? "Kick things off by creating your group's next championship — add drivers, build the calendar, and Round 1 is ready to race."
              : "Your championship admin hasn't started a season yet. Check back once one kicks off."
          }
          action={isAdmin ? <Button href="/championships/new">Create championship</Button> : undefined}
        />
        <ReigningChampionCard />
      </div>
    );
  }

  const hero = await getChampionshipFull(activeChampionships[0]!.id);
  const standings = computeStandings(hero);
  const nextRace = hero.races.find((r) => r.status === "OPEN");
  const lastRace = [...hero.races].reverse().find((r) => r.status === "COMPLETED");
  const lastRaceResults = lastRace
    ? [...lastRace.results].sort((a, b) => {
        const rank = (s: string) => (s === "FINISHED" ? 0 : s === "DNF" ? 1 : 2);
        if (rank(a.resultStatus) !== rank(b.resultStatus)) return rank(a.resultStatus) - rank(b.resultStatus);
        return (a.finishingPosition ?? 99) - (b.finishingPosition ?? 99);
      })
    : [];

  const otherActive = activeChampionships.slice(1);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
      <Link href={`/championships/${hero.id}`} className="block group">
        <div className="hud-card p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="hud-tick mb-2">
                HWC // {hero.year} · ROUND {hero.races.filter((r) => r.status === "COMPLETED").length + (nextRace ? 1 : 0)} / {hero.numberOfRaces}
              </div>
              <h1 className="text-3xl md:text-4xl mb-1 group-hover:text-heat-bright transition-colors">{hero.name}</h1>
              <ChampionshipProgress races={hero.races} />
            </div>
            {nextRace && (
              <div className="text-left md:text-right shrink-0">
                <div className="hud-tick mb-1">Next race</div>
                <div className="text-xl text-white font-display font-semibold">{nextRace.trackName}</div>
                <div className="text-sm text-track-400">Round {nextRace.roundNumber}</div>
              </div>
            )}
          </div>
          <div className="relative mt-5">
            <Button variant="secondary" size="sm">
              View championship →
            </Button>
          </div>
        </div>
      </Link>

      {otherActive.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {otherActive.map((c) => (
            <OtherActiveCard key={c.id} id={c.id} />
          ))}
        </div>
      )}

      <ReigningChampionCard />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg">Championship standings</h2>
            <Link href={`/championships/${hero.id}/standings`} className="text-xs text-heat hover:text-heat-bright font-mono uppercase tracking-wideish">
              Full table →
            </Link>
          </div>
          <div className="space-y-1">
            {standings.slice(0, 6).map((row) => (
              <Link
                key={row.driverId}
                href={`/championships/${hero.id}/drivers/${row.driverId}`}
                className="flex items-center gap-3 py-2 px-2 -mx-2 hover:bg-track-800/60 transition-colors"
              >
                <span className="w-5 stat-figure text-track-400 text-sm">{row.position}</span>
                <DriverAvatar name={row.driver.name} carColour={row.driver.carColour} avatarUrl={row.driver.avatarUrl} size={30} />
                <span className="flex-1 text-sm text-white truncate">{row.driver.nickname || row.driver.name}</span>
                <span className="stat-figure text-white font-semibold">{row.points}</span>
                <span className="hud-tick w-10 text-right">PTS</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg mb-4">Recent result</h2>
          {lastRace ? (
            <>
              <div className="hud-tick mb-1">ROUND {String(lastRace.roundNumber).padStart(2, "0")}</div>
              <div className="text-white font-display font-semibold text-lg mb-4">{lastRace.trackName}</div>
              <div className="space-y-1.5 mb-4">
                {lastRaceResults.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <PositionMark position={r.finishingPosition} />
                    <DriverAvatar name={r.driver.name} carColour={r.driver.carColour} avatarUrl={r.driver.avatarUrl} size={26} />
                    <span className="text-sm text-white">{r.driver.nickname || r.driver.name}</span>
                  </div>
                ))}
              </div>
              <Button href={`/championships/${hero.id}/races/${lastRace.id}`} variant="secondary" size="sm">
                View results
              </Button>
            </>
          ) : (
            <p className="text-sm text-track-400">No races completed yet — Round 1 is ready when you are.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

async function ReigningChampionCard() {
  const lastCompleted = await db.championship.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });
  if (!lastCompleted || !lastCompleted.championDriverId) return null;

  const champion = await db.driver.findUnique({ where: { id: lastCompleted.championDriverId } });
  if (!champion) return null;

  return (
    <Link
      href={`/championships/${lastCompleted.id}`}
      className="hud-card p-4 flex items-center gap-4 hover:border-track-400 transition-colors group"
    >
      <div className="text-2xl shrink-0">🏆</div>
      <DriverAvatar name={champion.name} carColour={champion.carColour} avatarUrl={champion.avatarUrl} size={40} />
      <div className="flex-1 min-w-0">
        <div className="hud-tick mb-0.5">Reigning champion · {lastCompleted.year}</div>
        <div className="text-white font-display font-semibold truncate group-hover:text-heat-bright transition-colors">
          {champion.name} <span className="text-track-400 font-normal">— {lastCompleted.name}</span>
        </div>
      </div>
      <span className="text-track-500 shrink-0">→</span>
    </Link>
  );
}

async function OtherActiveCard({ id }: { id: string }) {
  const c = await db.championship.findUnique({
    where: { id },
    include: { races: true },
  });
  if (!c) return null;
  const completed = c.races.filter((r) => r.status === "COMPLETED").length;
  return (
    <Link href={`/championships/${id}`} className="hud-card p-4 flex items-center justify-between hover:border-track-400 transition-colors">
      <div>
        <div className="text-white font-display font-semibold">{c.name}</div>
        <div className="hud-tick mt-0.5">
          HWC // {c.year} · Round {completed + 1}/{c.numberOfRaces}
        </div>
      </div>
      <span className="text-track-500">→</span>
    </Link>
  );
}
