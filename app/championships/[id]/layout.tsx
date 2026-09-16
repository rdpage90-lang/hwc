import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ChampionshipTabs } from "@/components/ChampionshipTabs";
import { Badge } from "@/components/ui";

export default async function ChampionshipLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const championship = await db.championship.findUnique({
    where: { id: params.id },
    include: { races: true },
  });
  if (!championship) notFound();

  const completedRounds = championship.races.filter((r) => r.status === "COMPLETED").length;
  const currentRound = Math.min(completedRounds + 1, championship.numberOfRaces);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6">
      <div className="mb-5">
        <div className="hud-tick mb-1.5 flex items-center gap-2">
          <span>HWC // {championship.year}</span>
          {championship.status === "COMPLETED" && <Badge tone="amber">Completed</Badge>}
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="text-2xl md:text-3xl">{championship.name}</h1>
          {championship.status !== "COMPLETED" && (
            <span className="stat-figure text-track-400 text-sm">
              Round {currentRound}/{championship.numberOfRaces}
            </span>
          )}
        </div>
      </div>

      <ChampionshipTabs id={championship.id} />

      <div className="mt-6 pb-16">{children}</div>
    </div>
  );
}
