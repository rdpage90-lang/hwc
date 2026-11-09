import { getChampionshipFull } from "@/lib/championship";
import { getChampionshipProgression } from "@/lib/progression";
import { Card } from "@/components/ui";
import { ProgressionCharts } from "@/components/ProgressionCharts";

export default async function ChampionshipProgressionPage({ params }: { params: { id: string } }) {
  const championship = await getChampionshipFull(params.id);
  const progression = getChampionshipProgression(championship);
  const { leadSummary, rounds } = progression;

  const leaderDriver = leadSummary.currentLeaderId
    ? championship.drivers.find((d) => d.driverId === leadSummary.currentLeaderId)?.driver
    : null;
  const leaderName = leaderDriver ? leaderDriver.nickname || leaderDriver.name : null;
  const leaderRoundsLed = leadSummary.currentLeaderId ? leadSummary.roundsLed.get(leadSummary.currentLeaderId) ?? 0 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">{championship.name}</h1>
        <p className="text-sm text-track-400 mt-1">{championship.year} · progression, generated from every completed round</p>
      </div>

      <Card>
        <ProgressionCharts progression={progression} />
      </Card>

      {rounds.length >= 2 && (
        <Card>
          <h2 className="text-lg mb-3">Championship lead</h2>
          {leaderName ? (
            <p className="text-sm text-white mb-4">
              {leaderName} has led after {leaderRoundsLed} of {rounds.length} round{rounds.length === 1 ? "" : "s"} played.
            </p>
          ) : (
            <p className="text-sm text-track-400 mb-4">No one has scored yet.</p>
          )}
          <div className="grid grid-cols-3 divide-x divide-track-800">
            <Stat label="Lead changes" value={leadSummary.leadChanges} />
            <Stat label="Largest lead" value={leadSummary.largestLead ? `+${leadSummary.largestLead.margin}` : "—"} />
            <Stat label="Closest margin" value={leadSummary.closestMargin ? leadSummary.closestMargin.margin : "—"} />
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-3 py-3 text-center">
      <div className="stat-figure text-white text-lg font-semibold">{value}</div>
      <div className="hud-tick mt-1">{label}</div>
    </div>
  );
}
