import type { RaceWithResults } from "@/types";

export interface RaceStatPlacing {
  position: number;
  driverId: string;
  name: string;
}

export interface RaceStatistics {
  winner: RaceStatPlacing | null;
  podium: RaceStatPlacing[];
  finishers: number;
  dnfs: number;
  dnsCount: number;
  totalPoints: number;
}

/**
 * V2 spec section 17. Takes results the race page has already loaded, so it
 * adds no query. "Biggest position gain/loss" is deliberately absent: HWC
 * stores where a driver finished, never where they started, so there's no
 * gain or loss to calculate — and the spec says not to invent statistics the
 * stored data can't support.
 */
export function getRaceStatistics(results: RaceWithResults["results"]): RaceStatistics {
  const toPlacing = (r: RaceWithResults["results"][number]): RaceStatPlacing => ({
    position: r.finishingPosition as number,
    driverId: r.driverId,
    name: r.driver.nickname || r.driver.name,
  });

  const podium = results
    .filter((r) => r.resultStatus === "FINISHED" && r.finishingPosition != null && r.finishingPosition <= 3)
    .sort((a, b) => (a.finishingPosition as number) - (b.finishingPosition as number))
    .map(toPlacing);

  return {
    winner: podium.find((p) => p.position === 1) ?? null,
    podium,
    finishers: results.filter((r) => r.resultStatus === "FINISHED").length,
    dnfs: results.filter((r) => r.resultStatus === "DNF").length,
    dnsCount: results.filter((r) => r.resultStatus === "DNS").length,
    // Sum of the stored per-result points — the same values every standings
    // view already adds up, nothing recalculated.
    totalPoints: results.reduce((sum, r) => sum + r.championshipPoints, 0),
  };
}
