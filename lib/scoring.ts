import type { Driver, ResultStatus } from "@prisma/client";
import type { ChampionshipFull, ConstructorStandingRow, PointsSystem, RoundCell, StandingRow } from "@/types";

/**
 * Default championship points table.
 *
 * HEAT's physical Championship System scoresheet doesn't publish a single
 * canonical digital points table, so this default is taken directly from
 * the worked example in the V1 spec (section 22: 1st=10, 2nd=8, 3rd=6,
 * 4th=5, 5th=4), extended down to 8 positions and with DNF worth 0.
 *
 * This is intentionally editable per-championship at creation time — swap
 * in your group's own scoresheet numbers if they differ.
 */
export function defaultPointsSystem(): PointsSystem {
  return {
    "1": 10,
    "2": 8,
    "3": 6,
    "4": 5,
    "5": 4,
    "6": 3,
    "7": 2,
    "8": 1,
    DNF: 0,
  };
}

/**
 * The single, centralized place points get calculated (spec section 15:
 * "The application should never allow the admin to manually type a
 * driver's points"). Every code path that creates a RaceResult must route
 * through this function.
 */
export function pointsFor(
  pointsSystem: PointsSystem,
  resultStatus: ResultStatus,
  finishingPosition: number | null,
): number {
  if (resultStatus === "DNS") return 0; // always zero, not configurable (section 9)
  if (resultStatus === "DNF") return pointsSystem.DNF ?? 0;
  if (resultStatus === "FINISHED" && finishingPosition != null) {
    return pointsSystem[String(finishingPosition)] ?? 0;
  }
  return 0;
}

/**
 * Builds the full standings table for a championship: totals, per-round
 * cells for the grid view, and the tie-broken championship position.
 *
 * Tie-break policy (spec section 17): HEAT's physical rules break ties by
 * final-race grid position, which doesn't translate cleanly to a running
 * mid-season standings table. Absent a published digital tie-break table,
 * this implements the standard motorsport countback used by F1 and most
 * point-scoring championships: most points, then most wins, then most
 * 2nd-places, then most 3rd-places, and so on down the finishing order.
 * If your group's physical rulebook specifies something else, this is the
 * one function to change.
 */
export function computeStandings(championship: ChampionshipFull): StandingRow[] {
  const pointsSystem = championship.pointsSystem as PointsSystem;
  const totalRounds = championship.numberOfRaces;

  const rows: StandingRow[] = championship.drivers.map(({ driver, joinedRound }) => {
    const perRound: (RoundCell | null)[] = Array.from({ length: totalRounds }, () => null);

    let points = 0;
    let wins = 0;
    let podiums = 0;
    let starts = 0;
    let dnfs = 0;
    let dnsCount = 0;
    let bestFinish: number | null = null;
    let finishSum = 0;
    let finishCount = 0;

    // finishing-position counts for the countback tie-break, index 0 = P1
    const positionCounts = new Array(totalRounds + 1).fill(0);

    for (const race of championship.races) {
      const idx = race.roundNumber - 1;
      if (idx < 0 || idx >= totalRounds) continue;

      if (race.roundNumber < joinedRound) {
        perRound[idx] = { kind: "not-joined" };
        continue;
      }

      const result = race.results.find((r) => r.driverId === driver.id);
      if (!result) {
        // Driver was eligible for this race but has no recorded result yet
        // (race not yet played, or not yet submitted) — leave blank rather
        // than treating as DNS.
        perRound[idx] = null;
        continue;
      }

      perRound[idx] = {
        kind: "result",
        status: result.resultStatus,
        position: result.finishingPosition,
        points: result.championshipPoints,
      };

      points += result.championshipPoints;

      if (result.resultStatus === "DNS") {
        dnsCount += 1;
      } else {
        starts += 1;
        if (result.resultStatus === "DNF") {
          dnfs += 1;
        } else if (result.resultStatus === "FINISHED" && result.finishingPosition != null) {
          const pos = result.finishingPosition;
          finishSum += pos;
          finishCount += 1;
          if (bestFinish == null || pos < bestFinish) bestFinish = pos;
          if (pos === 1) wins += 1;
          if (pos <= 3) podiums += 1;
          if (pos >= 1 && pos < positionCounts.length) positionCounts[pos] += 1;
        }
      }
    }

    return {
      driverId: driver.id,
      driver,
      points,
      wins,
      podiums,
      starts,
      dnfs,
      dnsCount,
      bestFinish,
      avgFinish: finishCount > 0 ? Math.round((finishSum / finishCount) * 10) / 10 : null,
      perRound,
      position: 0, // resolved below
      // stash for the comparator; not part of the public StandingRow shape
      // but harmless to carry as an extra field at runtime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...({ _positionCounts: positionCounts } as any),
    };
  });

  rows.sort((a, b) => compareStandingRows(a, b));
  rows.forEach((row, i) => {
    row.position = i + 1;
  });

  return rows;
}

function compareStandingRows(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.wins !== a.wins) return b.wins - a.wins;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aCounts: number[] = (a as any)._positionCounts ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bCounts: number[] = (b as any)._positionCounts ?? [];
  const maxLen = Math.max(aCounts.length, bCounts.length);
  for (let pos = 1; pos < maxLen; pos++) {
    const diff = (bCounts[pos] ?? 0) - (aCounts[pos] ?? 0);
    if (diff !== 0) return diff;
  }

  // Final fallback: alphabetical, purely for a stable/deterministic order.
  return a.driver.name.localeCompare(b.driver.name);
}

/** Resolves the champion driver from a completed championship's standings. */
export function resolveChampion(championship: ChampionshipFull): Driver | null {
  const standings = computeStandings(championship);
  return standings[0]?.driver ?? null;
}

/**
 * V2: constructors' standings (spec sections 10-11). Deliberately does
 * NOT recompute points — it sums the same `result.championshipPoints`
 * that `computeStandings` sums for drivers, just grouped by team instead
 * of by driver, so a team's total can never drift from what its drivers
 * actually scored. A driver with no team assignment contributes to no
 * team (not an error — teams are optional, not required).
 *
 * Returns an empty array if the championship has no teams at all, so
 * callers can treat "no constructors' table" as the normal case for any
 * championship (V1-era or otherwise) that was never given teams.
 *
 * Tie-break mirrors the driver standings' spirit at the level available
 * for a team: points, then wins, then podiums, then team name. No
 * position-by-position countback — that's not meaningful for a team the
 * way it is for a single driver's own finishing history.
 */
export function computeConstructorStandings(championship: ChampionshipFull): ConstructorStandingRow[] {
  if (championship.teams.length === 0) return [];

  const teamIdByDriverId = new Map(championship.driverTeams.map((dt) => [dt.driverId, dt.teamId]));

  const totals = new Map<string, { points: number; wins: number; podiums: number }>();
  for (const team of championship.teams) {
    totals.set(team.id, { points: 0, wins: 0, podiums: 0 });
  }

  for (const race of championship.races) {
    for (const result of race.results) {
      const teamId = teamIdByDriverId.get(result.driverId);
      if (!teamId) continue; // driver isn't assigned to a team this championship

      const teamTotals = totals.get(teamId);
      if (!teamTotals) continue; // guards against a stale/mismatched assignment

      teamTotals.points += result.championshipPoints;
      if (result.resultStatus === "FINISHED" && result.finishingPosition != null) {
        if (result.finishingPosition === 1) teamTotals.wins += 1;
        if (result.finishingPosition <= 3) teamTotals.podiums += 1;
      }
    }
  }

  const rows: ConstructorStandingRow[] = championship.teams.map((team) => {
    const teamTotals = totals.get(team.id)!;
    return {
      teamId: team.id,
      team,
      points: teamTotals.points,
      wins: teamTotals.wins,
      podiums: teamTotals.podiums,
      position: 0, // resolved below
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.podiums !== a.podiums) return b.podiums - a.podiums;
    return a.team.name.localeCompare(b.team.name);
  });
  rows.forEach((row, i) => {
    row.position = i + 1;
  });

  return rows;
}
