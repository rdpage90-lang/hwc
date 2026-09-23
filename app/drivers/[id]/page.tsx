import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { DriverAvatar, EmptyState, Badge } from "@/components/ui";
import { NewDriverForm } from "@/components/NewDriverForm";
import { DriverNumberEditor } from "@/components/DriverNumberEditor";
import { AssignTemporaryNumbersButton } from "@/components/AssignTemporaryNumbersButton";

export default async function DriversPage() {
  const [drivers, session] = await Promise.all([
    db.driver.findMany({
      orderBy: { name: "asc" },
      include: { championships: true, user: { select: { name: true } } },
    }),
    auth(),
  ]);
  const isAdmin = session?.user.role === "ADMIN";
  const unassignedCount = drivers.filter((d) => d.driverNumber === null).length;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl">Drivers</h1>
          <p className="text-sm text-track-400 mt-1">Every driver who's ever taken the grid, across every championship.</p>
        </div>
        <Link href="/drivers/leaderboard" className="text-xs text-heat hover:text-heat-bright font-mono uppercase tracking-wideish whitespace-nowrap shrink-0 mt-1">
          All-time standings →
        </Link>
      </div>

      {isAdmin && <AssignTemporaryNumbersButton unassignedCount={unassignedCount} />}

      {drivers.length === 0 ? (
        <EmptyState title="No drivers yet" body="Drivers are usually added while creating a championship, but you can also add one here." />
      ) : (
        <div className="hud-card divide-y divide-track-800">
          {drivers.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-track-800/40 transition-colors">
              <Link href={`/drivers/${d.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <DriverAvatar name={d.name} carColour={d.carColour} avatarUrl={d.avatarUrl} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm">{d.name}</div>
                  {d.nickname && <div className="text-xs text-track-500">&ldquo;{d.nickname}&rdquo;</div>}
                </div>
              </Link>
              <DriverNumberEditor driverId={d.id} driverNumber={d.driverNumber} isAdmin={isAdmin} />
              {d.user && <Badge tone="volt">Linked · {d.user.name}</Badge>}
              <span className="text-xs text-track-500">{d.championships.length} championship{d.championships.length === 1 ? "" : "s"}</span>
            </div>
          ))}
        </div>
      )}

      {isAdmin && <NewDriverForm />}
    </div>
  );
}
