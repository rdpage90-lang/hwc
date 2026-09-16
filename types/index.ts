import type {
  Championship,
  ChampionshipDriver,
  Driver,
  Race,
  RaceResult,
  ResultStatus,
} from "@prisma/client";

// The points table stored as JSON on Championship.pointsSystem.
// Keys "1".."N" are finishing-position points; "DNF" is the flat points a
// DNF driver receives. DNS is intentionally not configurable — it is
// always 0 (spec section 9) and is enforced in lib/scoring.ts.
export type PointsSystem = Record<string, number>;

export type DriverWithMembership = Driver & {
  championshipDriver: ChampionshipDriver;
};

export type RaceWithResults = Race & {
  results: (RaceResult & { driver: Driver })[];
};

export type ChampionshipFull = Championship & {
  drivers: (ChampionshipDriver & { driver: Driver })[];
  races: RaceWithResults[];
};

// One row of the standings table.
export interface StandingRow {
  driverId: string;
  driver: Driver;
  points: number;
  wins: number;
  podiums: number;
  starts: number;
  dnfs: number;
  dnsCount: number;
  bestFinish: number | null;
  avgFinish: number | null;
  perRound: (RoundCell | null)[]; // index 0 = round 1
  position: number; // 1-based championship position after tie-break
}

export type RoundCell =
  | { kind: "not-joined" }
  | { kind: "result"; status: ResultStatus; position: number | null; points: number };

export interface DriverStats {
  points: number;
  starts: number;
  wins: number;
  podiums: number;
  dnfs: number;
  dnsCount: number;
  bestFinish: number | null;
  avgFinish: number | null;
}
