import { Suspense } from "react";
import Link from "next/link";
import { getRaceArchiveFilterOptions, searchRaceArchive } from "@/lib/race-archive";
import { Card, EmptyState } from "@/components/ui";
import { RaceArchiveFiltersBar } from "@/components/RaceArchiveFiltersBar";

interface RaceArchiveSearchParams {
  championship?: string;
  year?: string;
  driver?: string;
  track?: string;
  team?: string;
}

export default async function RaceArchivePage({ searchParams }: { searchParams: RaceArchiveSearchParams }) {
  const options = await getRaceArchiveFilterOptions();

  const races = await searchRaceArchive({
    championshipId: searchParams.championship || undefined,
    year: searchParams.year ? Number(searchParams.year) : undefined,
    driverId: searchParams.driver || undefined,
    trackName: searchParams.track || undefined,
    teamId: searchParams.team || undefined,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">Race archive</h1>
        <p className="text-sm text-track-400 mt-1">Every race ever entered — filter by championship, year, driver, track, or team.</p>
      </div>

      <Card>
        <Suspense fallback={<div className="text-xs text-track-500">Loading filters…</div>}>
          <RaceArchiveFiltersBar options={options} />
        </Suspense>
      </Card>

      {races.length === 0 ? (
        <EmptyState title="No races match" body="Try loosening a filter — or nothing's been completed yet." />
      ) : (
        <div className="hud-card divide-y divide-track-800">
          {races.map((r) => (
            <Link
              key={r.id}
              href={`/championships/${r.championshipId}/races/${r.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-track-800/40 transition-colors"
            >
              <div>
                <div className="text-sm text-white">{r.trackName}</div>
                <div className="hud-tick mt-0.5">
                  {r.championshipName} · {r.year} · Round {r.roundNumber}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
