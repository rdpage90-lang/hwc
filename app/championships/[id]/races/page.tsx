import Link from "next/link";
import { getChampionshipFull } from "@/lib/championship";
import { Badge } from "@/components/ui";

export default async function RacesPage({ params }: { params: { id: string } }) {
  const championship = await getChampionshipFull(params.id);

  return (
    <div className="space-y-2">
      {championship.races.map((race) => {
        const locked = race.status === "UPCOMING";
        const content = (
          <div
            className={`hud-card p-4 flex items-center justify-between gap-4 transition-colors ${
              locked ? "opacity-50" : "hover:border-track-400"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="hud-tick w-16 shrink-0">ROUND {String(race.roundNumber).padStart(2, "0")}</span>
              <div>
                <div className="text-white font-display font-semibold">{race.trackName}</div>
                {race.raceDate && <div className="text-xs text-track-400">{new Date(race.raceDate).toLocaleDateString()}</div>}
              </div>
            </div>
            <StatusBadge status={race.status} />
          </div>
        );

        return locked ? (
          <div key={race.id}>{content}</div>
        ) : (
          <Link key={race.id} href={`/championships/${championship.id}/races/${race.id}`}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") return <Badge tone="volt">Completed</Badge>;
  if (status === "OPEN") return <Badge tone="heat">Open</Badge>;
  return <Badge tone="neutral">Locked</Badge>;
}
