import Link from "next/link";
import { db } from "@/lib/db";
import { Card, Badge, EmptyState, DriverAvatar } from "@/components/ui";

export default async function ArchivePage() {
  const championships = await db.championship.findMany({
    where: { status: "COMPLETED" },
    include: { races: true },
    orderBy: [{ year: "desc" }, { completedAt: "desc" }],
  });

  const champions = await db.driver.findMany({
    where: { id: { in: championships.map((c) => c.championDriverId).filter((v): v is string => !!v) } },
  });
  const championById = new Map(champions.map((c) => [c.id, c]));

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">Archive</h1>
        <p className="text-sm text-track-400 mt-1">Every completed HWC season, permanently on record.</p>
      </div>

      {championships.length === 0 ? (
        <EmptyState title="No seasons completed yet" body="Once a championship finishes its final round, it'll show up here forever." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {championships.map((c) => {
            const champion = c.championDriverId ? championById.get(c.championDriverId) : null;
            return (
              <Link key={c.id} href={`/championships/${c.id}`}>
                <Card className="hover:border-track-400 transition-colors h-full">
                  <div className="hud-tick mb-2">HWC // {c.year}</div>
                  <h3 className="text-lg text-white mb-3">{c.name}</h3>
                  {champion && (
                    <div className="flex items-center gap-2 mb-2">
                      <DriverAvatar name={champion.name} carColour={champion.carColour} avatarUrl={champion.avatarUrl} size={24} />
                      <span className="text-sm text-track-300">{champion.name}</span>
                      <Badge tone="amber">Champion</Badge>
                    </div>
                  )}
                  <span className="text-xs text-track-400">{c.numberOfRaces} races</span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
