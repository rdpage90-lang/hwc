import type { ChampionshipFull } from "@/types";
import { computeStandings } from "@/lib/scoring";

export interface ProgressionSeries {
  driverId: string;
  name: string;
  /** Aligned to `rounds` — null means the driver hadn't joined yet by that round. */
  points: (number | null)[];
  position: (number | null)[];
}

export interface LeadSummary {
  currentLeaderId: string | null;
  roundsLed: Map<string, number>;
  leadChanges: number;
  largestLead: { driverId: string; margin: number; round: number } | null;
  /** Smallest points gap between 1st and 2nd at any played round — including 0 for an exact tie. Not the same as the final victory margin in lib/records.ts, which only looks at a completed championship's final standings. */
  closestMargin: { round: number; margin: number } | null;
}

export interface ChampionshipProgression {
  /** Only rounds with at least one recorded result — nothing is plotted for the future. */
  rounds: number[];
  series: ProgressionSeries[];
  leadSummary: LeadSummary;
}

/**
 * V2 spec sections 15-16. Calls computeStandings once per played round
 * (same function every other standings view uses), then reads both the
 * points/position progression and the lead-change summary off that one
 * set of snapshots — no separate queries or recalculated points.
 */
export function getChampionshipProgression(championship: ChampionshipFull): ChampionshipProgression {
  const rounds = [...new Set(championship.races.filter((r) => r.results.length > 0).map((r) => r.roundNumber))].sort((a, b) => a - b);

  const snapshots = rounds.map((round) => ({
    round,
    standings: computeStandings({ ...championship, races: championship.races.filter((r) => r.roundNumber <= round) }),
  }));

  const series: ProgressionSeries[] = championship.drivers.map(({ driverId, driver }) => {
    const points: (number | null)[] = [];
    const position: (number | null)[] = [];
    for (const snap of snapshots) {
      const row = snap.standings.find((s) => s.driverId === driverId);
      points.push(row ? row.points : null);
      position.push(row ? row.position : null);
    }
    return { driverId, name: driver.nickname || driver.name, points, position };
  });

  const roundsLed = new Map<string, number>();
  let leadChanges = 0;
  let currentLeaderId: string | null = null;
  let largestLead: LeadSummary["largestLead"] = null;
  let closestMargin: LeadSummary["closestMargin"] = null;

  for (const snap of snapshots) {
    const leader = snap.standings[0];
    if (!leader || leader.points === 0) continue; // no meaningful leader before anyone's scored

    roundsLed.set(leader.driverId, (roundsLed.get(leader.driverId) ?? 0) + 1);
    if (currentLeaderId !== null && currentLeaderId !== leader.driverId) leadChanges += 1;
    currentLeaderId = leader.driverId;

    if (snap.standings.length >= 2) {
      const margin = leader.points - snap.standings[1].points;
      if (!largestLead || margin > largestLead.margin) {
        largestLead = { driverId: leader.driverId, margin, round: snap.round };
      }
      if (!closestMargin || margin < closestMargin.margin) {
        closestMargin = { round: snap.round, margin };
      }
    }
  }

  return {
    rounds,
    series,
    leadSummary: { currentLeaderId, roundsLed, leadChanges, largestLead, closestMargin },
  };
}
