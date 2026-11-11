import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getChampionshipFull } from "@/lib/championship";
import { RaceDayEntryForm } from "@/components/RaceDayEntryForm";

export default async function RaceDayEntryPage({ params }: { params: { id: string; raceId: string } }) {
  const [championship, session] = await Promise.all([getChampionshipFull(params.id), auth()]);
  const race = championship.races.find((r) => r.id === params.raceId);
  if (!race) notFound();

  // Only the admin enters results; everyone else just gets the pre-race screen.
  if (session?.user.role !== "ADMIN") redirect("/race-day");
  if (race.status === "COMPLETED") redirect(`/race-day/${championship.id}/${race.id}/result`);
  if (race.status !== "OPEN") redirect("/race-day");

  // Same eligibility rule the results route enforces: drivers who'd joined by this round.
  const drivers = championship.drivers
    .filter((cd) => cd.joinedRound <= race.roundNumber)
    .map(({ driver }) => ({
      id: driver.id,
      name: driver.name,
      nickname: driver.nickname,
      carColour: driver.carColour,
      avatarUrl: driver.avatarUrl,
      driverNumber: driver.driverNumber,
    }));

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
      <div className="mb-6">
        <div className="hud-tick mb-1">Race day · {championship.name}</div>
        <div className="hud-tick text-heat mb-1">Round {String(race.roundNumber).padStart(2, "0")}</div>
        <h1 className="text-2xl text-white">{race.trackName}</h1>
      </div>

      <RaceDayEntryForm championshipId={championship.id} raceId={race.id} drivers={drivers} />
    </div>
  );
}
