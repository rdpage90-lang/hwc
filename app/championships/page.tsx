import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Button, Card, EmptyState, Badge } from "@/components/ui";

export default async function ChampionshipsPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const championships = await db.championship.findMany({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    include: { races: true, drivers: true },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Championships</h1>
          <p className="text-sm text-track-400 mt-1">Seasons currently in progress.</p>
        </div>
        {isAdmin && <Button href="/championships/new">New championship</Button>}
      </div>

      {championships.length === 0 ? (
        <EmptyState
          title="No live championships"
          body={isAdmin ? "Create one to get your group racing." : "Nothing in progress right now — check the archive for past seasons."}
          action={isAdmin ? <Button href="/championships/new">Create championship</Button> : <Button href="/archive" variant="secondary">View archive</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {championships.map((c) => {
            const completed = c.races.filter((r) => r.status === "COMPLETED").length;
            return (
              <Link key={c.id} href={`/championships/${c.id}`}>
                <Card className="hover:border-track-400 transition-colors h-full">
                  <div className="hud-tick mb-2">HWC // {c.year}</div>
                  <h3 className="text-lg text-white mb-3">{c.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge tone={c.status === "ACTIVE" ? "heat" : "neutral"}>{c.status}</Badge>
                    <span className="text-xs text-track-400">
                      Round {completed + 1}/{c.numberOfRaces} · {c.drivers.length} drivers
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
