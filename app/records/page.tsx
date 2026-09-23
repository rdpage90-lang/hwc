import Link from "next/link";
import { getRecordsBook } from "@/lib/records";
import { Card } from "@/components/ui";

export default async function RecordsPage() {
  const { driverRecords, raceRecords } = await getRecordsBook();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">Records</h1>
        <p className="text-sm text-track-400 mt-1">Every all-time record, calculated fresh from every race ever entered.</p>
      </div>

      <Card>
        <h2 className="text-lg mb-4">Driver records</h2>
        <div className="space-y-1">
          {driverRecords.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 py-2.5 border-b border-track-800 last:border-0">
              <div className="min-w-0">
                <div className="text-sm text-white">{r.label}</div>
                {r.holder ? (
                  <Link href={`/drivers/${r.holder.driverId}`} className="text-xs text-heat hover:text-heat-bright">
                    {r.holder.name}
                    {r.context && <span className="text-track-500"> · {r.context}</span>}
                  </Link>
                ) : (
                  <span className="text-xs text-track-500">Not yet set</span>
                )}
              </div>
              <span className="stat-figure text-white font-semibold shrink-0">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg mb-4">Race records</h2>
        <div className="space-y-3">
          {raceRecords.map((r) => (
            <div key={r.label} className="border-b border-track-800 last:border-0 pb-3 last:pb-0">
              <div className="flex items-center justify-between gap-4 mb-1.5">
                <span className="text-sm text-white">{r.label}</span>
                <span className="stat-figure text-white font-semibold">{r.value}</span>
              </div>
              {r.races.length === 0 ? (
                <span className="text-xs text-track-500">Not yet set</span>
              ) : (
                <div className="space-y-1">
                  {r.races.map((race) => (
                    <Link
                      key={race.raceId}
                      href={`/championships/${race.championshipId}/races/${race.raceId}`}
                      className="block text-xs text-heat hover:text-heat-bright"
                    >
                      {race.championshipName} · Round {race.roundNumber} · {race.trackName}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
