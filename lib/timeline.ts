import type { ChampionshipFull } from "@/types";
import { computeStandings, computeConstructorStandings } from "@/lib/scoring";
import { getRaceStatistics } from "@/lib/race-stats";

export interface TimelineRound {
  roundNumber: number;
  trackName: string;
  lines: string[];
  /** Title-deciding moments, shown with extra emphasis (final round of a completed championship only). */
  highlights: string[];
}

const nameOf = (d: { name: string; nickname: string | null }) => d.nickname || d.name;

/**
 * V2 spec section 34: "a presentation layer generated from race data."
 * Walks the played rounds in order, and for each one reports the winner and
 * what happened to the championship lead, using the championship as it stood
 * after that round (same computeStandings every other page uses).
 */
export function getChampionshipTimeline(championship: ChampionshipFull): TimelineRound[] {
  const played = championship.races
    .filter((r) => r.results.length > 0)
    .sort((a, b) => a.roundNumber - b.roundNumber);

  const everLed = new Set<string>();
  let previousLeaderId: string | null = null;
  const rounds: TimelineRound[] = [];

  for (const race of played) {
    const stats = getRaceStatistics(race.results);
    const standings = computeStandings({
      ...championship,
      races: championship.races.filter((r) => r.roundNumber <= race.roundNumber),
    });
    const top = standings[0];
    const leader = top && top.points > 0 ? top : null;

    const lines: string[] = [stats.winner ? `${stats.winner.name} wins` : "No classified winner"];

    if (leader) {
      const leaderName = nameOf(leader.driver);
      if (previousLeaderId === null) {
        lines.push(`${leaderName} leads the championship`);
      } else if (leader.driverId !== previousLeaderId) {
        lines.push(everLed.has(leader.driverId) ? `${leaderName} retakes the lead` : `${leaderName} takes the championship lead`);
      } else {
        lines.push(`${leaderName} holds the lead`);
      }
      everLed.add(leader.driverId);
      previousLeaderId = leader.driverId;
    }

    const highlights: string[] = [];
    if (championship.status === "COMPLETED" && race.roundNumber === championship.numberOfRaces) {
      const champion =
        championship.drivers.find((d) => d.driverId === championship.championDriverId)?.driver ?? leader?.driver ?? null;
      if (champion) highlights.push(`🏆 ${nameOf(champion).toUpperCase()} BECOMES WORLD CHAMPION`);

      const topTeam = computeConstructorStandings(championship)[0];
      if (topTeam && topTeam.points > 0) highlights.push(`🏭 CONSTRUCTORS' CHAMPION: ${topTeam.team.name.toUpperCase()}`);
    }

    rounds.push({ roundNumber: race.roundNumber, trackName: race.trackName, lines, highlights });
  }

  return rounds;
}
