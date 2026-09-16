import { notFound } from "next/navigation";
import { getChampionshipFull } from "@/lib/championship";
import { computeStandings } from "@/lib/scoring";
import { DriverAvatar, Button } from "@/components/ui";

export default async function ChampionPage({ params }: { params: { id: string } }) {
  const championship = await getChampionshipFull(params.id);
  if (championship.status !== "COMPLETED") notFound();

  const standings = computeStandings(championship);
  const champion = standings[0];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-16 text-center">
      <div className="relative hud-card p-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-fade pointer-events-none" />
        <div className="relative">
          <div className="text-3xl mb-2">🏆</div>
          <div className="hud-tick mb-1">CHAMPIONSHIP COMPLETE</div>
          <div className="text-lg text-track-300 mb-1">{championship.year}</div>
          <h1 className="text-2xl md:text-3xl mb-8">{championship.name}</h1>

          {champion && (
            <>
              <div className="flex justify-center mb-4">
                <DriverAvatar name={champion.driver.name} carColour={champion.driver.carColour} avatarUrl={champion.driver.avatarUrl} size={84} />
              </div>
              <div className="hud-tick mb-1">World champion</div>
              <div className="text-3xl md:text-4xl text-white font-display font-bold mb-2">{champion.driver.name}</div>
              <div className="stat-figure text-heat-bright text-xl font-bold mb-4">{champion.points} POINTS</div>
              <div className="text-sm text-track-400">
                {champion.wins} wins · {champion.podiums} podiums · {champion.starts} races
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg mb-4">Final standings</h2>
        <div className="hud-card divide-y divide-track-800 text-left">
          {standings.map((row) => (
            <div key={row.driverId} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 stat-figure text-track-400">{row.position}</span>
              <DriverAvatar name={row.driver.name} carColour={row.driver.carColour} avatarUrl={row.driver.avatarUrl} size={28} />
              <span className="flex-1 text-white text-sm">{row.driver.nickname || row.driver.name}</span>
              <span className="stat-figure text-white font-semibold">{row.points} pts</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Button href="/archive" variant="secondary">
          View archive
        </Button>
        <Button href="/dashboard">Back to dashboard</Button>
      </div>
    </div>
  );
}
