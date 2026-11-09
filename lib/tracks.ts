import { db } from "@/lib/db";

export interface TrackDriverStats {
  driverId: string;
  name: string;
  races: number;
  wins: number;
  podiums: number;
  dnfs: number;
  dnsCount: number;
  avgFinish: number | null;
}

export interface TrackSummary {
  trackName: string;
  races: number;
  winnerCount: number;
  championships: { id: string; name: string; year: number }[];
  driverStats: TrackDriverStats[];
}

export interface TrackRecordEntry {
  driverId: string;
  name: string;
  value: number;
}

export interface TrackRecords {
  mostWins: TrackRecordEntry | null;
  mostPodiums: TrackRecordEntry | null;
  mostRaces: TrackRecordEntry | null;
  mostDNFs: TrackRecordEntry | null;
}

/** Every distinct track that's hosted at least one completed race, for the track index page. */
export async function listTracks(): Promise<{ trackName: string; races: number }[]> {
  const races = await db.race.findMany({ where: { status: "COMPLETED" }, select: { trackName: true } });

  const counts = new Map<string, number>();
  for (const r of races) counts.set(r.trackName, (counts.get(r.trackName) ?? 0) + 1);

  return [...counts.entries()]
    .map(([trackName, races]) => ({ trackName, races }))
    .sort((a, b) => b.races - a.races || a.trackName.localeCompare(b.trackName));
}

/**
 * V2 spec section 18: "Because V1 supports custom tracks, track identity
 * should initially be based on the track name." There's no separate Track
 * entity — this matches Race.trackName exactly. Two entries that are
 * really the same venue but typed differently ("Silverstone" vs
 * "silverstone ") will show up as different tracks; acceptable for now
 * since names are typed once per championship setup, but worth knowing.
 */
export async function getTrackSummary(trackName: string): Promise<TrackSummary | null> {
  const races = await db.race.findMany({
    where: { trackName, status: "COMPLETED" },
    include: {
      results: { include: { driver: { select: { id: true, name: true, nickname: true } } } },
      championship: { select: { id: true, name: true, year: true } },
    },
  });

  if (races.length === 0) return null;

  const championshipsById = new Map(races.map((r) => [r.championship.id, r.championship]));
  const winners = new Set<string>();

  interface Accumulator extends TrackDriverStats {
    finishSum: number;
    finishCount: number;
  }
  const byDriver = new Map<string, Accumulator>();

  for (const race of races) {
    for (const result of race.results) {
      const entry: Accumulator =
        byDriver.get(result.driverId) ?? {
          driverId: result.driverId,
          name: result.driver.nickname || result.driver.name,
          races: 0,
          wins: 0,
          podiums: 0,
          dnfs: 0,
          dnsCount: 0,
          avgFinish: null,
          finishSum: 0,
          finishCount: 0,
        };

      entry.races += 1;
      if (result.resultStatus === "DNS") {
        entry.dnsCount += 1;
      } else if (result.resultStatus === "DNF") {
        entry.dnfs += 1;
      } else if (result.resultStatus === "FINISHED" && result.finishingPosition != null) {
        entry.finishSum += result.finishingPosition;
        entry.finishCount += 1;
        if (result.finishingPosition === 1) {
          entry.wins += 1;
          winners.add(result.driverId);
        }
        if (result.finishingPosition <= 3) entry.podiums += 1;
      }

      byDriver.set(result.driverId, entry);
    }
  }

  const driverStats: TrackDriverStats[] = [...byDriver.values()]
    .map(({ finishSum, finishCount, ...rest }) => ({
      ...rest,
      avgFinish: finishCount > 0 ? Math.round((finishSum / finishCount) * 10) / 10 : null,
    }))
    .sort((a, b) => b.wins - a.wins || b.podiums - a.podiums || a.name.localeCompare(b.name));

  return {
    trackName,
    races: races.length,
    winnerCount: winners.size,
    championships: [...championshipsById.values()].sort((a, b) => b.year - a.year),
    driverStats,
  };
}

/** Derived from a TrackSummary already fetched — no extra query. */
export function getTrackRecords(summary: TrackSummary): TrackRecords {
  function top(key: "wins" | "podiums" | "races" | "dnfs"): TrackRecordEntry | null {
    const winner = [...summary.driverStats].sort((a, b) => b[key] - a[key])[0];
    return winner && winner[key] > 0 ? { driverId: winner.driverId, name: winner.name, value: winner[key] } : null;
  }
  return {
    mostWins: top("wins"),
    mostPodiums: top("podiums"),
    mostRaces: top("races"),
    mostDNFs: top("dnfs"),
  };
}
