import { db } from "@/lib/db";
import { getHeadToHead } from "@/lib/head-to-head";
import { Card } from "@/components/ui";
import { HeadToHeadPicker } from "@/components/HeadToHeadPicker";

export default async function HeadToHeadPage({ searchParams }: { searchParams: { a?: string; b?: string } }) {
  const drivers = await db.driver.findMany({
    where: { results: { some: {} } },
    select: { id: true, name: true, nickname: true, driverNumber: true },
    orderBy: { name: "asc" },
  });

  const aId = searchParams.a;
  const bId = searchParams.b;
  const driverIds = new Set(drivers.map((d) => d.id));
  const canCompare = !!aId && !!bId && aId !== bId && driverIds.has(aId) && driverIds.has(bId);

  const h2h = canCompare ? await getHeadToHead(aId!, bId!) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">Head-to-head</h1>
        <p className="text-sm text-track-400 mt-1">Compare any two drivers across every race they've shared a grid in.</p>
      </div>

      <Card>
        <HeadToHeadPicker drivers={drivers} defaultA={aId} defaultB={bId} />
      </Card>

      {h2h && (
        <>
          <Card>
            <div className="text-center hud-tick mb-4">
              {h2h.driverA.name}
              {h2h.driverA.driverNumber != null && ` #${String(h2h.driverA.driverNumber).padStart(2, "0")}`}
              {"  VS  "}
              {h2h.driverB.name}
              {h2h.driverB.driverNumber != null && ` #${String(h2h.driverB.driverNumber).padStart(2, "0")}`}
            </div>
            <h2 className="text-lg mb-3">Career comparison</h2>
            <CompareRow label="Championships" a={h2h.driverA.career.championshipsWon} b={h2h.driverB.career.championshipsWon} />
            <CompareRow label="Wins" a={h2h.driverA.career.wins} b={h2h.driverB.career.wins} />
            <CompareRow label="Podiums" a={h2h.driverA.career.podiums} b={h2h.driverB.career.podiums} />
            <CompareRow
              label="Points"
              a={h2h.driverA.career.points}
              b={h2h.driverB.career.points}
              note="Career points naturally favour whoever's raced more — worth checking starts alongside this one."
            />
          </Card>

          <Card>
            <h2 className="text-lg mb-1">Shared races</h2>
            <p className="text-xs text-track-500 mb-4">
              Only races where both drivers actually took the start — a DNS by either driver isn&apos;t counted.
            </p>

            {h2h.sharedRaces === 0 ? (
              <p className="text-sm text-track-400">These two have never raced each other.</p>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="stat-figure text-white text-2xl font-semibold">{h2h.sharedRaces}</div>
                  <div className="hud-tick mt-1">Races together</div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center">
                    <div className="stat-figure text-white text-xl font-semibold">{h2h.statsA.timesAhead}</div>
                    <div className="hud-tick mt-1">{h2h.driverA.name} finished ahead</div>
                    {h2h.driverALeadPct != null && <div className="text-xs text-track-500 mt-0.5">{h2h.driverALeadPct}%</div>}
                  </div>
                  <div className="text-center">
                    <div className="stat-figure text-white text-xl font-semibold">{h2h.statsB.timesAhead}</div>
                    <div className="hud-tick mt-1">{h2h.driverB.name} finished ahead</div>
                    {h2h.driverBLeadPct != null && <div className="text-xs text-track-500 mt-0.5">{h2h.driverBLeadPct}%</div>}
                  </div>
                </div>

                {h2h.currentStreak && (
                  <p className="text-xs text-track-400 text-center mb-4">
                    {(h2h.currentStreak.driverId === h2h.driverA.driverId ? h2h.driverA.name : h2h.driverB.name)}{" "}
                    has finished ahead in {h2h.currentStreak.length} race{h2h.currentStreak.length === 1 ? "" : "s"} in a row.
                  </p>
                )}

                <CompareRow label="Wins (shared races)" a={h2h.statsA.wins} b={h2h.statsB.wins} />
                <CompareRow label="Podiums (shared races)" a={h2h.statsA.podiums} b={h2h.statsB.podiums} />
                <CompareRow label="Avg finish (shared races)" a={h2h.statsA.avgFinish ?? "—"} b={h2h.statsB.avgFinish ?? "—"} />
                <CompareRow label="DNFs (shared races)" a={h2h.statsA.dnfs} b={h2h.statsB.dnfs} />
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function CompareRow({ label, a, b, note }: { label: string; a: number | string; b: number | string; note?: string }) {
  return (
    <div className="py-2 border-b border-track-800 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <span className="stat-figure text-white font-semibold w-14 text-left">{a}</span>
        <span className="text-xs text-track-400 flex-1 text-center">{label}</span>
        <span className="stat-figure text-white font-semibold w-14 text-right">{b}</span>
      </div>
      {note && <p className="text-[10px] text-track-600 text-center mt-1">{note}</p>}
    </div>
  );
}
