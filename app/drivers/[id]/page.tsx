import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { DriverAvatar, Badge, EmptyState } from "@/components/ui";

export default async function DriverPage({ params }: { params: { id: string } }) {
  const driver = await db.driver.findUnique({
    where: { id: params.id },
    include: { championships: { include: { championship: true }, orderBy: { joinedAt: "desc" } } },
  });
  if (!driver) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div className="hud-card p-6 flex items-center gap-5">
        <DriverAvatar name={driver.name} carColour={driver.carColour} avatarUrl={driver.avatarUrl} size={64} />
        <div>
          <h1 className="text-2xl text-white">{driver.name}</h1>
          {driver.nickname && <div className="text-sm text-track-400">&ldquo;{driver.nickname}&rdquo;</div>}
        </div>
      </div>

      <div>
        <h2 className="text-lg mb-3">Championships</h2>
        {driver.championships.length === 0 ? (
          <EmptyState title="No championships yet" body="This driver hasn't been added to a championship yet." />
        ) : (
          <div className="hud-card divide-y divide-track-800">
            {driver.championships.map((cd) => (
              <Link
                key={cd.championshipId}
                href={`/championships/${cd.championshipId}/drivers/${driver.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-track-800/40 transition-colors"
              >
                <div>
                  <div className="text-white text-sm">{cd.championship.name}</div>
                  <div className="hud-tick mt-0.5">{cd.championship.year}</div>
                </div>
                <Badge tone={cd.championship.status === "ACTIVE" ? "heat" : cd.championship.status === "COMPLETED" ? "amber" : "neutral"}>
                  {cd.championship.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
