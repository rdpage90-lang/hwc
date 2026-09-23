import type { ResultStatus } from "@prisma/client";
import { db } from "@/lib/db";

export interface StreakValue {
  current: number;
  longest: number;
}

export interface DriverStreaks {
  wins: StreakValue;
  podiums: StreakValue;
  points: StreakValue;
}

interface ChronoResult {
  year: number;
  championshipCreatedAt: Date;
  roundNumber: number;
  resultStatus: ResultStatus;
  finishingPosition: number | null;
  championshipPoints: number;
}

/**
 * Orders every race a driver has a recorded result in — across every
 * championship they've ever entered — into one chronological career
 * sequence. `Race.raceDate` is optional and often unset, so the ordering
 * key is (championship year, championship createdAt, round number). This
 * is a proxy for true chronological order, not a guarantee — two
 * championships started in the same year could, in principle, sort
 * differently than they were actually played (confirmed acceptable for
 * V2 rather than adding a hard date requirement).
 */
async function getDriverResultsChronological(driverId: string): Promise<ChronoResult[]> {
  const results = await db.raceResult.findMany({
    where: { driverId },
    select: {
      resultStatus: true,
      finishingPosition: true,
      championshipPoints: true,
      race: {
        select: {
          roundNumber: true,
          championship: { select: { year: true, createdAt: true } },
        },
      },
    },
  });

  return results
    .map((r) => ({
      year: r.race.championship.year,
      championshipCreatedAt: r.race.championship.createdAt,
      roundNumber: r.race.roundNumber,
      resultStatus: r.resultStatus,
      finishingPosition: r.finishingPosition,
      championshipPoints: r.championshipPoints,
    }))
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const createdDiff = a.championshipCreatedAt.getTime() - b.championshipCreatedAt.getTime();
      if (createdDiff !== 0) return createdDiff;
      return a.roundNumber - b.roundNumber;
    });
}

function isWin(r: ChronoResult) {
  return r.resultStatus === "FINISHED" && r.finishingPosition === 1;
}
function isPodium(r: ChronoResult) {
  return r.resultStatus === "FINISHED" && r.finishingPosition != null && r.finishingPosition <= 3;
}
function isPointsFinish(r: ChronoResult) {
  return r.championshipPoints > 0;
}

function computeStreak(races: ChronoResult[], hit: (r: ChronoResult) => boolean): StreakValue {
  let longest = 0;
  let running = 0;
  for (const r of races) {
    if (hit(r)) {
      running += 1;
      if (running > longest) longest = running;
    } else {
      running = 0;
    }
  }
  // Whatever's still running at the most recent race IS the current streak
  // (0 if the driver's last race broke it).
  return { current: running, longest };
}

/** Current + longest-ever streaks for one driver, across their whole career. */
export async function getDriverStreaks(driverId: string): Promise<DriverStreaks> {
  const races = await getDriverResultsChronological(driverId);
  return {
    wins: computeStreak(races, isWin),
    podiums: computeStreak(races, isPodium),
    points: computeStreak(races, isPointsFinish),
  };
}

export interface DriverStreaksRow extends DriverStreaks {
  driverId: string;
}

/**
 * Bulk version for every driver who has actually started a race — used by
 * both the records engine (to find the single longest-ever streak) and
 * the Hall of Fame (to rank the top 3). One query per driver; fine at this
 * app's scale, worth revisiting only if the roster gets large.
 */
export async function getAllDriverStreaks(): Promise<DriverStreaksRow[]> {
  const drivers = await db.driver.findMany({
    where: { results: { some: {} } },
    select: { id: true },
  });

  return Promise.all(
    drivers.map(async (d) => ({
      driverId: d.id,
      ...(await getDriverStreaks(d.id)),
    })),
  );
}

/**
 * V2 spec section 22: "consecutive races finishing ahead of a rival."
 * Inherently a two-driver comparison rather than a standalone streak, so
 * it isn't surfaced anywhere yet — this is here ready for when head-to-head
 * comparisons are built, at which point this is the function that page
 * calls.
 */
export async function getConsecutiveAheadOfRivalStreak(
  driverId: string,
  rivalId: string,
): Promise<StreakValue> {
  const [driverResults, rivalResults] = await Promise.all([
    db.raceResult.findMany({
      where: { driverId },
      select: {
        raceId: true,
        resultStatus: true,
        finishingPosition: true,
        race: { select: { roundNumber: true, championship: { select: { year: true, createdAt: true } } } },
      },
    }),
    db.raceResult.findMany({
      where: { driverId: rivalId },
      select: { raceId: true, resultStatus: true, finishingPosition: true },
    }),
  ]);

  const rivalByRaceId = new Map(rivalResults.map((r) => [r.raceId, r]));
  const rank = (status: ResultStatus) => (status === "FINISHED" ? 0 : status === "DNF" ? 1 : 2);

  const sharedRaces = driverResults
    .filter((r) => rivalByRaceId.has(r.raceId))
    .map((r) => ({
      year: r.race.championship.year,
      createdAt: r.race.championship.createdAt,
      round: r.race.roundNumber,
      driver: r,
      rival: rivalByRaceId.get(r.raceId)!,
    }))
    .sort((a, b) => a.year - b.year || a.createdAt.getTime() - b.createdAt.getTime() || a.round - b.round);

  let longest = 0;
  let running = 0;
  for (const race of sharedRaces) {
    const driverRank = rank(race.driver.resultStatus);
    const rivalRank = rank(race.rival.resultStatus);
    const driverAhead =
      driverRank !== rivalRank
        ? driverRank < rivalRank
        : race.driver.resultStatus === "FINISHED" &&
          (race.driver.finishingPosition ?? 99) < (race.rival.finishingPosition ?? 99);

    if (driverAhead) {
      running += 1;
      if (running > longest) longest = running;
    } else {
      running = 0;
    }
  }

  return { current: running, longest };
}
