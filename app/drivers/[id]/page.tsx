import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getDriverCareerStats, getDriverPointsByChampionship } from "@/lib/career";
import { DriverAvatar, Badge, EmptyState } from "@/components/ui";

export default async function DriverPage({ params }: { params: { id: string } }) {
  const driver = await db.driver.findUnique({
    where: { id: params.id },
    include: { championships: { include: { championship: true }, orderBy: { joinedAt: "desc" } } },
  });
  if (!driver) notFound();

  const [career, pointsByChampionship] = await Promise.all([
    getDriverCareerStats(driver.id),
    getDriverPointsByChampionship(driver.id),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div className="hud-card p-6 flex items-center gap-5">
        <DriverAvatar name={driver.name} carColour={driver.carColour} avatarUrl={driver.avatarUrl} size={64} />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl text-white">{driver.name}</h1>
            {driver.driverNumber != null && <Badge tone="volt">#{String(driver.driverNumber).padStart(2, "0")}</Badge>}
          </div>
          {driver.nickname && <div className="text-sm text-track-400">&ldquo;{driver.nickname}&rdquo;</div>}
        </div>
      </div>

      <div>
        <h2 className="text-lg mb-3">Career</h2>
        <div className="hud-card grid grid-cols-2 sm:grid-cols-4 divide-x divide-track-800">
          <CareerStat label="Career points" value={career.points} />
          <CareerStat label="Championships won" value={career.championshipsWon} />
          <CareerStat label="Wins" value={career.wins} />
          <CareerStat label="Podiums" value={career.podiums} />
          <CareerStat label="Starts" value={career.starts} />
          <CareerStat label="Best finish" value={career.bestFinish != null ? `P${career.bestFinish}` : "—"} />
          <CareerStat label="Avg finish" value={career.avgFinish != null ? career.avgFinish.toFixed(1) : "—"} />
          <CareerStat label="Championships entered" value={career.championshipsEntered} />
        </div>
      </div>

      <div>
        <h2 className="text-lg mb-3">Championships</h2>
        {driver.championships.length === 0 ? (
          <EmptyState title="No championships yet" body="This driver hasn't been added to a championship yet." />
        ) : (
          <div className="hud-card divide-y divide-track-800">
            {driver.championships.map((cd) => {
              const isChampion = cd.championship.championDriverId === driver.id;
              const points = pointsByChampionship.get(cd.championshipId) ?? 0;
              return (
                <Link
                  key={cd.championshipId}
                  href={`/championships/${cd.championshipId}/drivers/${driver.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-track-800/40 transition-colors"
                >
                  <div>
                    <div className="text-white text-sm">{cd.championship.name}</div>
                    <div className="hud-tick mt-0.5">
                      {cd.championship.year} · {points} PTS
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isChampion && <Badge tone="volt">Champion</Badge>}
                    <Badge tone={cd.championship.status === "ACTIVE" ? "heat" : cd.championship.status === "COMPLETED" ? "amber" : "neutral"}>
                      {cd.championship.status}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CareerStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-4 py-3.5">
      <div className="stat-figure text-white text-xl font-semibold">{value}</div>
      <div className="hud-tick mt-1">{label}</div>
    </div>
  );
}
