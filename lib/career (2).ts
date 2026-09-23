import type { RaceResult } from "@prisma/client";
import { db } from "@/lib/db";
import { getChampionshipFull } from "@/lib/championship";
import { computeStandings } from "@/lib/scoring";

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

export interface DriverChampionshipHistoryRow {
  championshipId: string;
  championship: { id: string; name: string; year: number; status: string };
  points: number;
  /** Tie-broken finishing position from computeStandings — null only if
   *  the driver was somehow removed from a championship's driver list
   *  after joining, which shouldn't happen but is guarded against. */
  position: number | null;
  totalDrivers: number;
  isChampion: boolean;
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
 * Every championship a driver has entered, with their actual tie-broken
 * finishing position in each — not just a points total. Runs
 * computeStandings per championship (same function the championship
 * overview page uses), so a driver's position here can never disagree
 * with that championship's own standings table.
 *
 * Fine at this app's scale (a driver's career is a handful to a few dozen
 * championships, not thousands) — if that stops being true, this is the
 * one place to add caching.
 */
export async function getDriverChampionshipHistory(driverId: string): Promise<DriverChampionshipHistoryRow[]> {
  const memberships = await db.championshipDriver.findMany({
    where: { driverId },
    include: { championship: true },
    orderBy: { joinedAt: "desc" },
  });

  return Promise.all(
    memberships.map(async (m) => {
      const full = await getChampionshipFull(m.championshipId);
      const standings = computeStandings(full);
      const row = standings.find((s) => s.driverId === driverId);

      return {
        championshipId: m.championshipId,
        championship: {
          id: m.championship.id,
          name: m.championship.name,
          year: m.championship.year,
          status: m.championship.status,
        },
        points: row?.points ?? 0,
        position: row?.position ?? null,
        totalDrivers: standings.length,
        isChampion: m.championship.championDriverId === driverId,
      };
    }),
  );
}

/**
 * All-time HWC Career Standings — every driver who has actually started a
 * race, ranked by career points. Drivers who exist on the roster or are
 * registered for an upcoming championship but have never started a race
 * are left off deliberately (matches "every driver who's ever taken the
 * grid" — registering isn't taking the grid, starting is).
 */
export async function getCareerLeaderboard(): Promise<CareerLeaderboardRow[]> {
  const [drivers, championshipWins] = await Promise.all([
    db.driver.findMany({
      include: { results: true, championships: true },
      orderBy: { name: "asc" }, // deterministic base order before sort/tie-break
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

  const rows: CareerLeaderboardRow[] = drivers
    .map((driver) => ({
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
    }))
    .filter((row) => row.starts > 0);

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.championshipsWon !== a.championshipsWon) return b.championshipsWon - a.championshipsWon;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.podiums !== a.podiums) return b.podiums - a.podiums;
    const nameCompare = a.driver.name.localeCompare(b.driver.name);
    if (nameCompare !== 0) return nameCompare;
    // Final fallback for two identically-named, identically-statted
    // drivers — guarantees a stable order across requests.
    return a.driverId.localeCompare(b.driverId);
  });
  rows.forEach((row, i) => {
    row.position = i + 1;
  });

  return rows;
}
