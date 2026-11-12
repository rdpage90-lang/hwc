import type { ChampionshipFull, StandingRow } from "@/types";
import { computeStandings, computeConstructorStandings } from "@/lib/scoring";
import { getRaceStatistics } from "@/lib/race-stats";

type Race = ChampionshipFull["races"][number];

export interface RaceReport {
  headline: string;
  paragraphs: string[];
}

export interface RaceImpact {
  leader: { driverId: string; name: string; points: number } | null;
  secondName: string | null;
  /** Points between 1st and 2nd in the championship after this race. */
  gap: number | null;
  remainingRounds: number;
}

/** The championship as it stood after a given round — later races simply aren't there yet. */
function snapshot(championship: ChampionshipFull, upToRound: number): ChampionshipFull {
  return { ...championship, races: championship.races.filter((r) => r.roundNumber <= upToRound) };
}

const nameOf = (d: { name: string; nickname: string | null }) => d.nickname || d.name;
const pts = (n: number) => `${n} point${n === 1 ? "" : "s"}`;
const racesWord = (n: number) => `${n} race${n === 1 ? "" : "s"}`;

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** Nobody leads a championship in which nobody has scored yet. */
function leaderOf(rows: StandingRow[]): StandingRow | null {
  const top = rows[0];
  return top && top.points > 0 ? top : null;
}

/** Consecutive wins by this driver within this championship, up to and including the given round. */
function winStreak(championship: ChampionshipFull, driverId: string, upToRound: number): number {
  const races = championship.races.filter((r) => r.roundNumber <= upToRound).sort((a, b) => b.roundNumber - a.roundNumber);
  let streak = 0;
  for (const race of races) {
    const result = race.results.find((r) => r.driverId === driverId);
    if (result && result.resultStatus === "FINISHED" && result.finishingPosition === 1) streak += 1;
    else break;
  }
  return streak;
}

/** Where the championship stands once this race is in — used by the celebration screen. */
export function getRaceImpact(championship: ChampionshipFull, race: Race): RaceImpact {
  const after = computeStandings(snapshot(championship, race.roundNumber));
  const leader = leaderOf(after);
  const second = after[1];
  return {
    leader: leader ? { driverId: leader.driverId, name: nameOf(leader.driver), points: leader.points } : null,
    secondName: second ? nameOf(second.driver) : null,
    gap: leader && second ? leader.points - second.points : null,
    remainingRounds: Math.max(0, championship.numberOfRaces - race.roundNumber),
  };
}

/**
 * V2 spec sections 27-28. Everything here comes from stored results and the
 * standings computed from them. Each sentence is only added when the data to
 * support it exists, so the report never states anything that isn't true.
 * No external AI is involved — it's fixed templates filled with real values.
 */
export function getRaceReport(championship: ChampionshipFull, race: Race): RaceReport | null {
  if (race.status !== "COMPLETED" || race.results.length === 0) return null;

  const stats = getRaceStatistics(race.results);
  const winner = stats.winner;
  const track = race.trackName;

  const afterStandings = computeStandings(snapshot(championship, race.roundNumber));
  const beforeStandings = race.roundNumber > 1 ? computeStandings(snapshot(championship, race.roundNumber - 1)) : null;

  const leaderAfter = leaderOf(afterStandings);
  const leaderBefore = beforeStandings ? leaderOf(beforeStandings) : null;
  const secondAfter = afterStandings[1];
  const secondBefore = beforeStandings?.[1];
  const gapAfter = leaderAfter && secondAfter ? leaderAfter.points - secondAfter.points : null;
  const gapBefore = leaderBefore && secondBefore ? leaderBefore.points - secondBefore.points : null;

  const remaining = Math.max(0, championship.numberOfRaces - race.roundNumber);
  const isFinal = remaining === 0;
  const leaderChanged = !!leaderAfter && !!leaderBefore && leaderAfter.driverId !== leaderBefore.driverId;

  const leaderName = leaderAfter ? nameOf(leaderAfter.driver) : null;
  const previousLeaderName = leaderBefore ? nameOf(leaderBefore.driver) : null;
  const secondName = secondAfter ? nameOf(secondAfter.driver) : null;

  // ---- Headline ----
  let headline: string;
  if (!winner) {
    headline = `NO WINNER AT ${track}`;
  } else if (isFinal && leaderName) {
    headline = `${leaderName} CLAIMS THE TITLE`;
  } else if (race.roundNumber === 1) {
    headline = `${winner.name} WINS THE OPENER`;
  } else if (leaderChanged && leaderName) {
    headline = `${leaderName} TAKES THE LEAD`;
  } else if (leaderAfter && leaderName && leaderAfter.driverId === winner.driverId) {
    headline = gapBefore != null && gapAfter != null && gapAfter > gapBefore ? `${winner.name} EXTENDS THE LEAD` : `${winner.name} HOLDS THE LEAD`;
  } else if (leaderName) {
    headline = `${winner.name} WINS, ${leaderName} STAYS AHEAD`;
  } else {
    headline = `${winner.name} WINS AT ${track}`;
  }

  const paragraphs: string[] = [];

  // ---- Paragraph 1: the race itself ----
  if (!winner) {
    paragraphs.push(`Nobody was classified at ${track}.`);
  } else {
    const behind: string[] = [];
    const runnerUp = stats.podium[1];
    const thirdPlace = stats.podium[2];
    if (runnerUp) behind.push(runnerUp.name);
    if (thirdPlace) behind.push(thirdPlace.name);

    let p1 =
      behind.length === 0
        ? `${winner.name} was the only classified finisher at ${track}.`
        : `${winner.name} claimed victory at ${track}, finishing ahead of ${behind.join(" and ")}.`;

    const streak = winStreak(championship, winner.driverId, race.roundNumber);
    if (streak >= 2) p1 += ` ${winner.name} has now won ${streak} races in a row.`;
    paragraphs.push(p1);
  }

  // ---- Paragraph 2: what it did to the championship ----
  if (leaderAfter && leaderName) {
    const rem = racesWord(remaining);
    let p2: string;

    if (isFinal) {
      if (gapAfter == null || !secondName) p2 = `That was the final round: ${leaderName} is the ${championship.year} champion with ${pts(leaderAfter.points)}.`;
      else if (gapAfter === 0) p2 = `That was the final round: ${leaderName} is the ${championship.year} champion, level with ${secondName} on ${pts(leaderAfter.points)} and ahead on countback.`;
      else p2 = `That was the final round: ${leaderName} is the ${championship.year} champion with ${pts(leaderAfter.points)}, ${pts(gapAfter)} clear of ${secondName}.`;
    } else if (!beforeStandings) {
      p2 = `${leaderName} leads the championship with ${pts(leaderAfter.points)} after the opening round.`;
    } else if (leaderChanged && previousLeaderName) {
      if (gapAfter == null || !secondName) p2 = `${leaderName} moves ahead of ${previousLeaderName} to lead the championship with ${rem} remaining.`;
      else if (gapAfter === 0) p2 = `${leaderName} moves level with ${secondName} on points, ahead on countback, with ${rem} remaining.`;
      else p2 = `${leaderName} moves ahead of ${previousLeaderName} to lead the championship by ${pts(gapAfter)} with ${rem} remaining.`;
    } else if (gapBefore != null && gapAfter != null) {
      if (gapAfter === 0 && secondName) p2 = `The result leaves ${leaderName} level with ${secondName} on points, ahead on countback, with ${rem} remaining.`;
      else if (gapAfter > gapBefore) p2 = `The result extends ${leaderName}'s championship lead to ${pts(gapAfter)} with ${rem} remaining.`;
      else if (gapAfter < gapBefore) p2 = `The result cuts ${leaderName}'s championship lead to ${pts(gapAfter)} with ${rem} remaining.`;
      else p2 = `${leaderName}'s championship lead stays at ${pts(gapAfter)} with ${rem} remaining.`;
    } else {
      p2 = `${leaderName} leads the championship on ${pts(leaderAfter.points)} with ${rem} remaining.`;
    }
    paragraphs.push(p2);
  }

  // ---- Paragraph 3: movers and teams, only when there's something true to say ----
  const extras: string[] = [];

  if (beforeStandings) {
    const positionBefore = new Map(beforeStandings.map((r) => [r.driverId, r.position]));
    let bestClimb: { name: string; from: number; to: number } | null = null;
    for (const row of afterStandings) {
      if (leaderAfter && row.driverId === leaderAfter.driverId) continue; // the lead is already covered above
      const from = positionBefore.get(row.driverId);
      if (from == null) continue;
      const climb = from - row.position;
      if (climb >= 2 && (!bestClimb || climb > bestClimb.from - bestClimb.to)) {
        bestClimb = { name: nameOf(row.driver), from, to: row.position };
      }
    }
    if (bestClimb) extras.push(`${bestClimb.name} climbs from ${ordinal(bestClimb.from)} to ${ordinal(bestClimb.to)} in the standings.`);
  }

  if (championship.teams.length > 0) {
    const constructorsAfter = computeConstructorStandings(snapshot(championship, race.roundNumber))[0];
    if (constructorsAfter && constructorsAfter.points > 0) {
      const constructorsBefore =
        race.roundNumber > 1 ? computeConstructorStandings(snapshot(championship, race.roundNumber - 1))[0] : undefined;
      if (constructorsBefore && constructorsBefore.points > 0 && constructorsBefore.teamId !== constructorsAfter.teamId) {
        extras.push(`${constructorsAfter.team.name} takes the constructors' lead.`);
      } else {
        extras.push(`${constructorsAfter.team.name} leads the constructors' standings on ${pts(constructorsAfter.points)}.`);
      }
    }
  }

  if (extras.length > 0) paragraphs.push(extras.join(" "));

  return { headline: headline.toUpperCase(), paragraphs };
}
