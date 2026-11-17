import type { ChampionshipFull } from "@/types";
import { computeStandings, computeConstructorStandings } from "@/lib/scoring";

export interface AwardWinner {
  kind: "driver" | "team";
  id: string;
  name: string;
}

export interface SeasonAward {
  key: string;
  icon: string;
  label: string;
  winners: AwardWinner[];
  value: number | null;
  unit: string | null;
}

export interface SeasonAwards {
  championshipName: string;
  year: number;
  awards: SeasonAward[];
}

const nameOf = (d: { name: string; nickname: string | null }) => d.nickname || d.name;

/**
 * V2 spec sections 31-32. Awards exist only for completed championships and
 * only where a plain rule over stored results decides them — no subjective
 * awards like "Unluckiest Driver". Nothing here is stored; it's recalculated
 * from results, which are immutable once a championship completes.
 *
 * Ties are shared: if two drivers both have the most wins, both are shown.
 * An award nobody qualifies for (e.g. "Most DNFs" in a season with no DNFs)
 * is left out rather than handed to someone on zero.
 */
export function getSeasonAwards(championship: ChampionshipFull): SeasonAwards | null {
  if (championship.status !== "COMPLETED") return null;

  const standings = computeStandings(championship);
  const awards: SeasonAward[] = [];

  // The champion recorded at completion; falls back to the top of the final
  // standings only if that field was somehow never set.
  const championRow = standings.find((r) => r.driverId === championship.championDriverId) ?? standings[0];
  if (championRow) {
    awards.push({
      key: "world-champion",
      icon: "🏆",
      label: "World Champion",
      winners: [{ kind: "driver", id: championRow.driverId, name: nameOf(championRow.driver) }],
      value: championRow.points,
      unit: "pts",
    });
  }

  const topTeam = computeConstructorStandings(championship)[0];
  if (topTeam && topTeam.points > 0) {
    awards.push({
      key: "constructors-champion",
      icon: "🏭",
      label: "Constructors' Champion",
      winners: [{ kind: "team", id: topTeam.teamId, name: topTeam.team.name }],
      value: topTeam.points,
      unit: "pts",
    });
  }

  const mostOf = (key: "wins" | "podiums" | "dnfs", award: { key: string; icon: string; label: string; unit: string }) => {
    const max = Math.max(0, ...standings.map((r) => r[key]));
    if (max === 0) return;
    awards.push({
      key: award.key,
      icon: award.icon,
      label: award.label,
      winners: standings
        .filter((r) => r[key] === max)
        .map((r) => ({ kind: "driver" as const, id: r.driverId, name: nameOf(r.driver) })),
      value: max,
      unit: award.unit,
    });
  };

  mostOf("wins", { key: "most-wins", icon: "⚡", label: "Most Wins", unit: "wins" });
  mostOf("podiums", { key: "most-podiums", icon: "🔥", label: "Most Podiums", unit: "podiums" });
  mostOf("dnfs", { key: "most-dnfs", icon: "💥", label: "Most DNFs", unit: "DNFs" });

  return { championshipName: championship.name, year: championship.year, awards };
}
