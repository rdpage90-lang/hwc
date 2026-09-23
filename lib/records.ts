import { db } from "@/lib/db";
import { getChampionshipFull } from "@/lib/championship";
import { computeStandings } from "@/lib/scoring";
import { getCareerLeaderboard, type CareerLeaderboardRow } from "@/lib/career";
import { getAllDriverStreaks, type DriverStreaksRow } from "@/lib/streaks";

export interface DriverRecordEntry {
  label: string;
  holder: { driverId: string; name: string } | null;
  value: number;
  /** e.g. the championship or context the record was set in, if relevant. */
  context?: string;
}

export interface RaceRecordEntry {
  label: string;
  value: number;
  races: { raceId: string; championshipId: string; championshipName: string; roundNumber: number; trackName: string }[];
}

export interface RecordsBook {
  driverRecords: DriverRecordEntry[];
  raceRecords: RaceRecordEntry[];
}

interface DriverChampionshipAgg {
  driverId: string;
  championshipId: string;
  wins: number;
  podiums: number;
  points: number;
}

/** Wins/podiums/points per (driver, championship) pair — a single pass over every RaceResult, grouped. */
async function getDriverChampionshipAggregates(): Promise<DriverChampionshipAgg[]> {
  const results = await db.raceResult.findMany({
    select: {
      driverId: true,
      resultStatus: true,
      finishingPosition: true,
      championshipPoints: true,
      race: { select: { championshipId: true } },
    },
  });

  const byKey = new Map<string, DriverChampionshipAgg>();
  for (const r of results) {
    const key = `${r.driverId}:${r.race.championshipId}`;
    const entry = byKey.get(key) ?? { driverId: r.driverId, championshipId: r.race.championshipId, wins: 0, podiums: 0, points: 0 };
    entry.points += r.championshipPoints;
    if (r.resultStatus === "FINISHED" && r.finishingPosition != null) {
      if (r.finishingPosition === 1) entry.wins += 1;
      if (r.finishingPosition <= 3) entry.podiums += 1;
    }
    byKey.set(key, entry);
  }
  return [...byKey.values()];
}

interface LeadMarginResult {
  bestLead: { driverId: string; championshipId: string; rounds: number } | null;
  bestMargin: { driverId: string; championshipId: string; margin: number } | null;
}

/**
 * "Longest championship lead" and "biggest championship victory margin"
 * (V2 spec section 21) both need round-by-round standings within each
 * championship, which computeStandings doesn't give directly — so this
 * calls it once per completed round, per championship, by handing it a
 * copy of the championship with later rounds' races excluded. That's the
 * same function the championship overview page uses; nothing here
 * recalculates a point or re-implements tie-breaking.
 */
async function getChampionshipLeadAndMarginRecords(): Promise<LeadMarginResult> {
  const championships = await db.championship.findMany({ select: { id: true, status: true } });

  let bestLead: LeadMarginResult["bestLead"] = null;
  let bestMargin: LeadMarginResult["bestMargin"] = null;

  for (const c of championships) {
    const full = await getChampionshipFull(c.id);

    const playedRounds = [...new Set(full.races.filter((r) => r.results.length > 0).map((r) => r.roundNumber))].sort(
      (a, b) => a - b,
    );

    let currentLeader: string | null = null;
    let runLength = 0;
    let bestRunForThisChampionship = { driverId: "", rounds: 0 };

    for (const round of playedRounds) {
      const upToRound = { ...full, races: full.races.filter((r) => r.roundNumber <= round) };
      const standings = computeStandings(upToRound);
      const leader = standings[0];
      if (!leader || leader.points === 0) continue; // no meaningful leader before anyone's scored

      if (leader.driverId === currentLeader) {
        runLength += 1;
      } else {
        currentLeader = leader.driverId;
        runLength = 1;
      }
      if (runLength > bestRunForThisChampionship.rounds) {
        bestRunForThisChampionship = { driverId: currentLeader, rounds: runLength };
      }
    }

    if (bestRunForThisChampionship.rounds > 0 && (!bestLead || bestRunForThisChampionship.rounds > bestLead.rounds)) {
      bestLead = { driverId: bestRunForThisChampionship.driverId, championshipId: c.id, rounds: bestRunForThisChampionship.rounds };
    }

    if (full.status === "COMPLETED") {
      const finalStandings = computeStandings(full);
      const winner = finalStandings[0];
      const runnerUp = finalStandings[1];
      
      if (winner && runnerUp) {
        const margin = winner.points - runnerUp.points;
        
        if (!bestMargin || margin > bestMargin.margin) {
          bestMargin = { 
            driverId: winner.driverId, 
            championshipId: c.id, 
            margin,
          };
        }
      }
    }
  }

  return { bestLead, bestMargin };
}

/**
 * Race-level records (V2 spec section 21). "Biggest winning margin" is
 * deliberately not included — HWC stores finishing position and points,
 * never a time or gap, so there's no real margin to calculate. Fabricating
 * one (e.g. from the points table) would misrepresent it as a measured
 * quantity when it's really just a fixed function of the points system.
 */
async function getRaceRecords(): Promise<RaceRecordEntry[]> {
  const races = await db.race.findMany({
    where: { status: "COMPLETED" },
    include: { results: true, championship: { select: { name: true } } },
  });

  function topRaces(count: (results: (typeof races)[number]["results"]) => number, label: string): RaceRecordEntry {
    let maxValue = 0;
    let winners: typeof races = [];
    for (const race of races) {
      const value = count(race.results);
      if (value > maxValue) {
        maxValue = value;
        winners = [race];
      } else if (value === maxValue && value > 0) {
        winners.push(race);
      }
    }
    return {
      label,
      value: maxValue,
      races: winners.map((r) => ({
        raceId: r.id,
        championshipId: r.championshipId,
        championshipName: r.championship.name,
        roundNumber: r.roundNumber,
        trackName: r.trackName,
      })),
    };
  }

  return [
    topRaces((results) => results.filter((r) => r.resultStatus === "DNF").length, "Most DNFs in a race"),
    topRaces((results) => results.filter((r) => r.resultStatus === "FINISHED").length, "Most finishers in a race"),
    topRaces((results) => results.filter((r) => r.resultStatus === "DNS").length, "Most DNS in a race"),
  ];
}

function topFromLeaderboard(
  leaderboard: CareerLeaderboardRow[],
  key: "championshipsWon" | "wins" | "podiums" | "points" | "starts",
  label: string,
): DriverRecordEntry {
  const top = [...leaderboard].sort((a, b) => b[key] - a[key])[0];
  return {
    label,
    holder: top && top[key] > 0 ? { driverId: top.driverId, name: top.driver.nickname || top.driver.name } : null,
    value: top ? top[key] : 0,
  };
}

function topFromAggregates(
  aggregates: DriverChampionshipAgg[],
  key: "wins" | "podiums" | "points",
  label: string,
  driverName: Map<string, string>,
  championshipName: Map<string, string>,
): DriverRecordEntry {
  const top = [...aggregates].sort((a, b) => b[key] - a[key])[0];
  return {
    label,
    holder: top && top[key] > 0 ? { driverId: top.driverId, name: driverName.get(top.driverId) ?? "Unknown" } : null,
    value: top ? top[key] : 0,
    context: top ? championshipName.get(top.championshipId) : undefined,
  };
}

function topFromStreaks(
  streaks: DriverStreaksRow[],
  key: "wins" | "podiums" | "points",
  label: string,
  driverName: Map<string, string>,
): DriverRecordEntry {
  const top = [...streaks].sort((a, b) => b[key].longest - a[key].longest)[0];
  return {
    label,
    holder: top && top[key].longest > 0 ? { driverId: top.driverId, name: driverName.get(top.driverId) ?? "Unknown" } : null,
    value: top ? top[key].longest : 0,
  };
}

export async function getRecordsBook(): Promise<RecordsBook> {
  const [leaderboard, aggregates, streaks, leadAndMargin, raceRecords, drivers, championships] = await Promise.all([
    getCareerLeaderboard(),
    getDriverChampionshipAggregates(),
    getAllDriverStreaks(),
    getChampionshipLeadAndMarginRecords(),
    getRaceRecords(),
    db.driver.findMany({ select: { id: true, name: true, nickname: true } }),
    db.championship.findMany({ select: { id: true, name: true } }),
  ]);

  const driverName = new Map(drivers.map((d) => [d.id, d.nickname || d.name]));
  const championshipName = new Map(championships.map((c) => [c.id, c.name]));

  const driverRecords: DriverRecordEntry[] = [
    topFromLeaderboard(leaderboard, "championshipsWon", "Most championships"),
    topFromLeaderboard(leaderboard, "wins", "Most race wins"),
    topFromLeaderboard(leaderboard, "podiums", "Most podiums"),
    topFromLeaderboard(leaderboard, "points", "Most career points"),
    topFromAggregates(aggregates, "wins", "Most wins in a championship", driverName, championshipName),
    topFromAggregates(aggregates, "podiums", "Most podiums in a championship", driverName, championshipName),
    topFromAggregates(aggregates, "points", "Most points in a championship", driverName, championshipName),
    topFromStreaks(streaks, "wins", "Most consecutive wins", driverName),
    topFromStreaks(streaks, "podiums", "Most consecutive podiums", driverName),
    topFromStreaks(streaks, "points", "Most consecutive points finishes", driverName),
    {
      label: "Longest championship lead",
      holder: leadAndMargin.bestLead
        ? { driverId: leadAndMargin.bestLead.driverId, name: driverName.get(leadAndMargin.bestLead.driverId) ?? "Unknown" }
        : null,
      value: leadAndMargin.bestLead?.rounds ?? 0,
      context: leadAndMargin.bestLead ? championshipName.get(leadAndMargin.bestLead.championshipId) : undefined,
    },
    {
      label: "Biggest championship victory margin",
      holder: leadAndMargin.bestMargin
        ? { driverId: leadAndMargin.bestMargin.driverId, name: driverName.get(leadAndMargin.bestMargin.driverId) ?? "Unknown" }
        : null,
      value: leadAndMargin.bestMargin?.margin ?? 0,
      context: leadAndMargin.bestMargin ? championshipName.get(leadAndMargin.bestMargin.championshipId) : undefined,
    },
  ];

  return { driverRecords, raceRecords };
}

export interface HallOfFameEntry {
  driverId: string;
  name: string;
  value: number;
}

export interface HallOfFameSection {
  label: string;
  entries: HallOfFameEntry[]; // top 3, ties broken by name for a stable order
}

export interface HallOfFame {
  sections: HallOfFameSection[];
}

function top3FromLeaderboard(
  leaderboard: CareerLeaderboardRow[],
  key: "championshipsWon" | "wins" | "podiums" | "points" | "starts",
): HallOfFameEntry[] {
  return [...leaderboard]
    .filter((row) => row[key] > 0)
    .sort((a, b) => b[key] - a[key] || a.driver.name.localeCompare(b.driver.name))
    .slice(0, 3)
    .map((row) => ({ driverId: row.driverId, name: row.driver.nickname || row.driver.name, value: row[key] }));
}

function top3FromStreaks(streaks: DriverStreaksRow[], key: "wins" | "podiums", driverName: Map<string, string>): HallOfFameEntry[] {
  return [...streaks]
    .filter((row) => row[key].longest > 0)
    .sort((a, b) => b[key].longest - a[key].longest)
    .slice(0, 3)
    .map((row) => ({ driverId: row.driverId, name: driverName.get(row.driverId) ?? "Unknown", value: row[key].longest }));
}

/**
 * V2 spec section 23. Unlike the single-holder records above, the Hall of
 * Fame shows the top 3 per category — calculated dynamically from the same
 * leaderboard/streaks data, never stored.
 */
export async function getHallOfFame(): Promise<HallOfFame> {
  const [leaderboard, streaks, drivers] = await Promise.all([
    getCareerLeaderboard(),
    getAllDriverStreaks(),
    db.driver.findMany({ select: { id: true, name: true, nickname: true } }),
  ]);
  const driverName = new Map(drivers.map((d) => [d.id, d.nickname || d.name]));

  return {
    sections: [
      { label: "Most Championships", entries: top3FromLeaderboard(leaderboard, "championshipsWon") },
      { label: "Most Wins", entries: top3FromLeaderboard(leaderboard, "wins") },
      { label: "Most Podiums", entries: top3FromLeaderboard(leaderboard, "podiums") },
      { label: "Most Career Points", entries: top3FromLeaderboard(leaderboard, "points") },
      { label: "Most Races", entries: top3FromLeaderboard(leaderboard, "starts") },
      { label: "Most Consecutive Wins", entries: top3FromStreaks(streaks, "wins", driverName) },
      { label: "Most Consecutive Podiums", entries: top3FromStreaks(streaks, "podiums", driverName) },
    ],
  };
}
