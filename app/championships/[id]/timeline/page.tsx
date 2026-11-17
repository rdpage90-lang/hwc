import Link from "next/link";
import { getChampionshipFull } from "@/lib/championship";
import { getChampionshipTimeline } from "@/lib/timeline";
import { EmptyState } from "@/components/ui";

export default async function ChampionshipTimelinePage({ params }: { params: { id: string } }) {
  const championship = await getChampionshipFull(params.id);

  if (championship.status !== "COMPLETED") {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <EmptyState title="The timeline arrives with the final round" body="Once the championship is completed, its whole story appears here." />
      </div>
    );
  }

  const rounds = getChampionshipTimeline(championship);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      <div className="mb-8">
        <div className="hud-tick mb-1">{championship.year} season</div>
        <h1 className="text-2xl">{championship.name}</h1>
        <p className="text-sm text-track-400 mt-1">The season, round by round.</p>
      </div>

      <div className="relative border-l-2 border-track-700 ml-2 space-y-8">
        {rounds.map((round) => (
          <div key={round.roundNumber} className="relative pl-6">
            <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-heat border-2 border-track-950" aria-hidden />
            <div className="hud-tick mb-1">
              Round {String(round.roundNumber).padStart(2, "0")} · {round.trackName}
            </div>
            <div className="space-y-0.5">
              {round.lines.map((line, i) => (
                <div key={i} className={i === 0 ? "text-white font-display font-semibold" : "text-sm text-track-300"}>
                  {line}
                </div>
              ))}
            </div>
            {round.highlights.length > 0 && (
              <div className="mt-3 space-y-1">
                {round.highlights.map((highlight, i) => (
                  <div key={i} className="text-sm font-display font-bold text-heat tracking-tightish">
                    {highlight}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10">
        <Link
          href={`/championships/${championship.id}/awards`}
          className="text-xs text-heat hover:text-heat-bright font-mono uppercase tracking-wideish"
        >
          See the season awards →
        </Link>
      </div>
    </div>
  );
}
