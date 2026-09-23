import type { RaceResult } from "@prisma/client";
import { db } from "@/lib/db";

export interface CareerStats {
  points: number;
  starts: number;
  wins: number;
  podiums: number;
  dnfs: number;
  dnsCount: number;
  bestFinish: number | null;
  avgFinish: number | null;
  championshipsEntered: number;
  championshipsWon: number;
}

export interface CareerLeaderboardRow extends CareerStats {
  driverId: string;
  driver: { id: string; name: string; nickname: string | null; carColour: string; avatarUrl: string | null; driverNumber: number | null };
  position: number;
}

/**
 * Shared by getDriverCareerStats and getCareerLeaderboard so the two never
 * drift — both just sum `RaceResult.championshipPoints`, the value
 * pointsFor() already computed once in lib/scoring.ts. Nothing here
 * recalculates a point.
 */
function aggregateResults(results: RaceResult[]) {
  let points = 0;
  let starts = 0;
  let wins = 0;
  let podiums = 0;
  let dnfs = 0;
  let dnsCount = 0;
  let bestFinish: number | null = null;
  let finishSum = 0;
  let finishCount = 0;

  for (const result of results) {
    points += result.championshipPoints;

    if (result.resultStatus === "DNS") {
      dnsCount += 1;
      continue;
    }
    starts += 1;
    if (result.resultStatus === "DNF") {
      dnfs += 1;
      continue;
    }
    if (result.resultStatus === "FINISHED" && result.finishingPosition != null) {
      const pos = result.finishingPosition;
      finishSum += pos;
      finishCount += 1;
      if (bestFinish == null || pos < bestFinish) bestFinish = pos;
      if (pos === 1) wins += 1;
      if (pos <= 3) podiums += 1;
    }
  }

  return {
    points,
    starts,
    wins,
    podiums,
    dnfs,
    dnsCount,
    bestFinish,
    avgFinish: finishCount > 0 ? Math.round((finishSum / finishCount) * 10) / 10 : null,
  };
}

/** Career totals for one driver, across every championship they've entered. */
export async function getDriverCareerStats(driverId: string): Promise<CareerStats> {
  const [results, championshipsEntered, championshipsWon] = await Promise.all([
    db.raceResult.findMany({ where: { driverId } }),
    db.championshipDriver.count({ where: { driverId } }),
    // Championship.championDriverId is set once a championship completes
    // (V1 spec section 17/26) — counting it directly avoids re-resolving
    // tie-broken standings for every past championship just to know who won.
    db.championship.count({ where: { championDriverId: driverId, status: "COMPLETED" } }),
  ]);

  return {
    ...aggregateResults(results),
    championshipsEntered,
    championshipsWon,
  };
}

/**
 * Per-championship point total for one driver, keyed by championshipId —
 * used by the driver profile page's championship history list. Not a
 * finishing position (that needs the full tie-broken standings for each
 * championship); just "how many points did they score here."
 */
export async function getDriverPointsByChampionship(driverId: string): Promise<Map<string, number>> {
  const results = await db.raceResult.findMany({
    where: { driverId },
    select: { championshipPoints: true, race: { select: { championshipId: true } } },
  });

  const totals = new Map<string, number>();
  for (const result of results) {
    const championshipId = result.race.championshipId;
    totals.set(championshipId, (totals.get(championshipId) ?? 0) + result.championshipPoints);
  }
  return totals;
}

/** All-time HWC Career Standings — every driver ranked by career stats. */
export async function getCareerLeaderboard(): Promise<CareerLeaderboardRow[]> {
  const [drivers, championshipWins] = await Promise.all([
    db.driver.findMany({
      include: { results: true, championships: true },
    }),
    db.championship.findMany({
      where: { status: "COMPLETED", championDriverId: { not: null } },
      select: { championDriverId: true },
    }),
  ]);

  const winsByDriverId = new Map<string, number>();
  for (const c of championshipWins) {
    const id = c.championDriverId as string;
    winsByDriverId.set(id, (winsByDriverId.get(id) ?? 0) + 1);
  }

  const rows: CareerLeaderboardRow[] = drivers.map((driver) => ({
    driverId: driver.id,
    driver: {
      id: driver.id,
      name: driver.name,
      nickname: driver.nickname,
      carColour: driver.carColour,
      avatarUrl: driver.avatarUrl,
      driverNumber: driver.driverNumber,
    },
    ...aggregateResults(driver.results),
    championshipsEntered: driver.championships.length,
    championshipsWon: winsByDriverId.get(driver.id) ?? 0,
    position: 0, // resolved below
  }));

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.championshipsWon !== a.championshipsWon) return b.championshipsWon - a.championshipsWon;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.podiums !== a.podiums) return b.podiums - a.podiums;
    return a.driver.name.localeCompare(b.driver.name);
  });
  rows.forEach((row, i) => {
    row.position = i + 1;
  });

  return rows;
}
