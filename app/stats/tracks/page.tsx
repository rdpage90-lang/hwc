import Link from "next/link";
import { listTracks } from "@/lib/tracks";
import { EmptyState } from "@/components/ui";

export default async function TracksIndexPage() {
  const tracks = await listTracks();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">Track history</h1>
        <p className="text-sm text-track-400 mt-1">Every track HWC has raced at, with every result on record.</p>
      </div>

      {tracks.length === 0 ? (
        <EmptyState title="No completed races yet" body="Track history appears once races have been completed." />
      ) : (
        <div className="hud-card divide-y divide-track-800">
          {tracks.map((t) => (
            <Link
              key={t.trackName}
              href={`/stats/tracks/${encodeURIComponent(t.trackName)}`}
              className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-track-800/40 transition-colors"
            >
              <span className="text-sm text-white">{t.trackName}</span>
              <span className="hud-tick">{t.races} race{t.races === 1 ? "" : "s"}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
