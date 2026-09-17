import { getChampionshipFull } from "@/lib/championship";
import { auth } from "@/auth";
import { DriverAvatar, Badge } from "@/components/ui";
import { AddDriverForm } from "@/components/AddDriverForm";
import { RemoveDriverButton } from "@/components/RemoveDriverButton";
import Link from "next/link";

export default async function ChampionshipDriversPage({ params }: { params: { id: string } }) {
  const [championship, session] = await Promise.all([getChampionshipFull(params.id), auth()]);
  const isAdmin = session?.user.role === "ADMIN";

  const sorted = [...championship.drivers].sort((a, b) => a.driver.name.localeCompare(b.driver.name));

  const driverIdsWithResults = new Set(championship.races.flatMap((r) => r.results.map((res) => res.driverId)));

  return (
    <div className="space-y-6">
      <div className="hud-card divide-y divide-track-800">
        {sorted.map((cd) => (
          <div key={cd.driverId} className="flex items-center gap-3 px-4 py-3 hover:bg-track-800/40 transition-colors group">
            <Link href={`/championships/${championship.id}/drivers/${cd.driverId}`} className="flex items-center gap-3 flex-1 min-w-0">
              <DriverAvatar name={cd.driver.name} carColour={cd.driver.carColour} avatarUrl={cd.driver.avatarUrl} size={34} />
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm truncate">{cd.driver.name}</div>
                {cd.driver.nickname && <div className="text-xs text-track-500 truncate">&ldquo;{cd.driver.nickname}&rdquo;</div>}
              </div>
              {cd.driver.user && <Badge tone="volt">Linked · {cd.driver.user.name}</Badge>}
              {cd.joinedRound > 1 && <Badge tone="amber">Joined R{cd.joinedRound}</Badge>}
            </Link>
            {isAdmin && championship.status !== "COMPLETED" && !driverIdsWithResults.has(cd.driverId) && (
              <RemoveDriverButton championshipId={championship.id} driverId={cd.driverId} />
            )}
          </div>
        ))}
      </div>

      {isAdmin && championship.status !== "COMPLETED" && <AddDriverForm championshipId={championship.id} existingDriverIds={sorted.map((d) => d.driverId)} />}
    </div>
  );
}
