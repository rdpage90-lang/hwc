import Link from "next/link";
import { getChampionshipFull } from "@/lib/championship";
import { getSeasonAwards } from "@/lib/awards";
import { Card, EmptyState } from "@/components/ui";

export default async function SeasonAwardsPage({ params }: { params: { id: string } }) {
  const championship = await getChampionshipFull(params.id);
  const awards = getSeasonAwards(championship);

  if (!awards) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <EmptyState title="Awards come at the end of the season" body="They're calculated automatically once the final round is completed." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
      <div className="mb-2">
        <div className="hud-tick mb-1">{awards.year} season</div>
        <h1 className="text-2xl">{awards.championshipName} awards</h1>
        <p className="text-sm text-track-400 mt-1">Calculated from the recorded results — nothing here is entered by hand.</p>
      </div>

      {awards.awards.map((award) => (
        <Card key={award.key}>
          <div className="flex items-center gap-4">
            <span className="text-3xl shrink-0">{award.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="hud-tick mb-1">{award.label}</div>
              <div className="text-lg text-white font-display font-semibold">
                {award.winners.map((winner, i) => (
                  <span key={`${winner.kind}-${winner.id}`}>
                    {i > 0 && <span className="text-track-500"> · </span>}
                    {winner.kind === "driver" ? (
                      <Link href={`/drivers/${winner.id}`} className="hover:text-heat-bright transition-colors">
                        {winner.name}
                      </Link>
                    ) : (
                      winner.name
                    )}
                  </span>
                ))}
              </div>
            </div>
            {award.value != null && (
              <div className="text-right shrink-0">
                <div className="stat-figure text-white text-xl font-semibold">{award.value}</div>
                {award.unit && <div className="hud-tick">{award.unit}</div>}
              </div>
            )}
          </div>
        </Card>
      ))}

      <Link
        href={`/championships/${championship.id}/timeline`}
        className="inline-block text-xs text-heat hover:text-heat-bright font-mono uppercase tracking-wideish"
      >
        See the season timeline →
      </Link>
    </div>
  );
}
