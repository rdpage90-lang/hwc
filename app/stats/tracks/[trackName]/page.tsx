import { notFound } from "next/navigation";
import Link from "next/link";
import { getTrackSummary, getTrackRecords, type TrackRecordEntry } from "@/lib/tracks";
import { Card } from "@/components/ui";

export default async function TrackDetailPage({ params }: { params: { trackName: string } }) {
  const trackName = decodeURIComponent(params.trackName);
  const summary = await getTrackSummary(trackName);
  if (!summary) notFound();

  const records = getTrackRecords(summary);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">{summary.trackName}</h1>
        <p className="text-sm text-track-400 mt-1">HWC track history</p>
      </div>

      <Card>
        <div className="grid grid-cols-2 divide-x divide-track-800">
          <div className="px-4 py-3.5 text-center">
            <div className="stat-figure text-white text-xl font-semibold">{summary.races}</div>
            <div className="hud-tick mt-1">Races</div>
          </div>
          <div className="px-4 py-3.5 text-center">
            <div className="stat-figure text-white text-xl font-semibold">{summary.winnerCount}</div>
            <div className="hud-tick mt-1">Different winners</div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg mb-3">Track records</h2>
        <div className="space-y-1">
          <RecordRow label="Most wins" entry={records.mostWins} />
          <RecordRow label="Most podiums" entry={records.mostPodiums} />
          <RecordRow label="Most races" entry={records.mostRaces} />
          <RecordRow label="Most DNFs" entry={records.mostDNFs} />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg mb-3">By driver</h2>
        <div className="space-y-1">
          {summary.driverStats.map((d) => (
            <Link
              key={d.driverId}
              href={`/drivers/${d.driverId}`}
              className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 hover:bg-track-800/40 transition-colors"
            >
              <span className="flex-1 text-sm text-white truncate">{d.name}</span>
              <span className="text-xs text-track-400 shrink-0">
                {d.wins}W · {d.podiums}P · {d.dnfs} DNF{d.dnsCount > 0 ? ` · ${d.dnsCount} DNS` : ""}
              </span>
              <span className="hud-tick w-16 text-right shrink-0">{d.avgFinish != null ? `AVG ${d.avgFinish}` : "—"}</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg mb-3">Championships raced at</h2>
        <div className="space-y-1">
          {summary.championships.map((c) => (
            <Link
              key={c.id}
              href={`/championships/${c.id}`}
              className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 hover:bg-track-800/40 transition-colors"
            >
              <span className="text-sm text-white">{c.name}</span>
              <span className="hud-tick">{c.year}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function RecordRow({ label, entry }: { label: string; entry: TrackRecordEntry | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-track-800 last:border-0">
      <span className="text-sm text-white">{label}</span>
      {entry ? (
        <Link href={`/drivers/${entry.driverId}`} className="text-xs text-heat hover:text-heat-bright">
          {entry.name} — {entry.value}
        </Link>
      ) : (
        <span className="text-xs text-track-500">Not yet set</span>
      )}
    </div>
  );
}
