import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { DriverAvatar, EmptyState } from "@/components/ui";
import { NewDriverForm } from "@/components/NewDriverForm";

export default async function DriversPage() {
  const [drivers, session] = await Promise.all([
    db.driver.findMany({ orderBy: { name: "asc" }, include: { championships: true } }),
    auth(),
  ]);
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">Drivers</h1>
        <p className="text-sm text-track-400 mt-1">Every driver who's ever taken the grid, across every championship.</p>
      </div>

      {drivers.length === 0 ? (
        <EmptyState title="No drivers yet" body="Drivers are usually added while creating a championship, but you can also add one here." />
      ) : (
        <div className="hud-card divide-y divide-track-800">
          {drivers.map((d) => (
            <Link key={d.id} href={`/drivers/${d.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-track-800/40 transition-colors">
              <DriverAvatar name={d.name} carColour={d.carColour} avatarUrl={d.avatarUrl} size={32} />
              <div className="flex-1">
                <div className="text-white text-sm">{d.name}</div>
                {d.nickname && <div className="text-xs text-track-500">&ldquo;{d.nickname}&rdquo;</div>}
              </div>
              <span className="text-xs text-track-500">{d.championships.length} championship{d.championships.length === 1 ? "" : "s"}</span>
            </Link>
          ))}
        </div>
      )}

      {isAdmin && <NewDriverForm />}
    </div>
  );
}
