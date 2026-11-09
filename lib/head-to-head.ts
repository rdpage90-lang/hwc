import { db } from "@/lib/db";
import { getDriverCareerStats, type CareerStats } from "@/lib/career";
import { getConsecutiveAheadOfRivalStreak } from "@/lib/streaks";

export interface DriverCareerComparison {
  driverId: string;
  name: string;
  driverNumber: number | null;
  career: CareerStats;
}

export interface SharedRaceStats {
  driverId: string;
  wins: number;
  podiums: number;
  dnfs: number;
  avgFinish: number | null;
  timesAhead: number;
}

export interface HeadToHead {
  driverA: DriverCareerComparison;
  driverB: DriverCareerComparison;
  /** Races where BOTH drivers actually took the start — a DNS by either excludes the race entirely (V2 spec section 9). */
  sharedRaces: number;
  statsA: SharedRaceStats;
  statsB: SharedRaceStats;
  driverALeadPct: number | null;
  driverBLeadPct: number | null;
  currentStreak: { driverId: string; length: number } | null;
  longestStreakA: number;
  longestStreakB: number;
}

export async function getHeadToHead(driverAId: string, driverBId: string): Promise<HeadToHead> {
  const [driverA, driverB] = await Promise.all([
    db.driver.findUnique({ where: { id: driverAId }, select: { id: true, name: true, nickname: true, driverNumber: true } }),
    db.driver.findUnique({ where: { id: driverBId }, select: { id: true, name: true, nickname: true, driverNumber: true } }),
  ]);
  if (!driverA || !driverB) throw new Error("Driver not found");

  const [careerA, careerB, resultsA, resultsB, streakAAheadOfB, streakBAheadOfA] = await Promise.all([
    getDriverCareerStats(driverAId),
    getDriverCareerStats(driverBId),
    db.raceResult.findMany({ where: { driverId: driverAId } }),
    db.raceResult.findMany({ where: { driverId: driverBId } }),
    getConsecutiveAheadOfRivalStreak(driverAId, driverBId),
    getConsecutiveAheadOfRivalStreak(driverBId, driverAId),
  ]);

  const resultsBByRaceId = new Map(resultsB.map((r) => [r.raceId, r]));

  // "Actually participated" (V2 spec section 9) means raced, not just
  // entered — a DNS means a driver never took the start, so a race where
  // either driver DNS'd is excluded from the shared-race set entirely.
  type Result = (typeof resultsA)[number];
  const shared: { a: Result; b: Result }[] = [];
  for (const rA of resultsA) {
    if (rA.resultStatus === "DNS") continue;
    const rB = resultsBByRaceId.get(rA.raceId);
    if (!rB || rB.resultStatus === "DNS") continue;
    shared.push({ a: rA, b: rB });
  }

  function summarize(driverId: string, pick: "a" | "b"): SharedRaceStats {
    const other = pick === "a" ? "b" : "a";
    let wins = 0;
    let podiums = 0;
    let dnfs = 0;
    let finishSum = 0;
    let finishCount = 0;
    let timesAhead = 0;

    for (const pair of shared) {
      const mine = pair[pick];
      const theirs = pair[other];

      if (mine.resultStatus === "FINISHED" && mine.finishingPosition != null) {
        finishSum += mine.finishingPosition;
        finishCount += 1;
        if (mine.finishingPosition === 1) wins += 1;
        if (mine.finishingPosition <= 3) podiums += 1;
      } else if (mine.resultStatus === "DNF") {
        dnfs += 1;
      }

      // Ordering rule (V2 spec section 9, documented): a classified finish
      // always beats a DNF; between two finishes, lower position wins;
      // between two DNFs there's no meaningful ordering in the stored
      // data, so neither side is credited "ahead" for that race.
      const mineFinished = mine.resultStatus === "FINISHED" && mine.finishingPosition != null;
      const theirsFinished = theirs.resultStatus === "FINISHED" && theirs.finishingPosition != null;
      if (mineFinished && (!theirsFinished || (mine.finishingPosition as number) < (theirs.finishingPosition as number))) {
        timesAhead += 1;
      }
    }

    return {
      driverId,
      wins,
      podiums,
      dnfs,
      avgFinish: finishCount > 0 ? Math.round((finishSum / finishCount) * 10) / 10 : null,
      timesAhead,
    };
  }

  const statsA = summarize(driverAId, "a");
  const statsB = summarize(driverBId, "b");
  const sharedRaces = shared.length;

  const currentStreak =
    streakAAheadOfB.current > 0
      ? { driverId: driverAId, length: streakAAheadOfB.current }
      : streakBAheadOfA.current > 0
        ? { driverId: driverBId, length: streakBAheadOfA.current }
        : null;

  return {
    driverA: { driverId: driverA.id, name: driverA.nickname || driverA.name, driverNumber: driverA.driverNumber, career: careerA },
    driverB: { driverId: driverB.id, name: driverB.nickname || driverB.name, driverNumber: driverB.driverNumber, career: careerB },
    sharedRaces,
    statsA,
    statsB,
    driverALeadPct: sharedRaces > 0 ? Math.round((statsA.timesAhead / sharedRaces) * 100) : null,
    driverBLeadPct: sharedRaces > 0 ? Math.round((statsB.timesAhead / sharedRaces) * 100) : null,
    currentStreak,
    longestStreakA: streakAAheadOfB.longest,
    longestStreakB: streakBAheadOfA.longest,
  };
}
