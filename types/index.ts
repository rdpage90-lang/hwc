import type {
  Championship,
  ChampionshipDriver,
  Driver,
  Race,
  RaceResult,
  ResultStatus,
} from "@prisma/client";

export type PointsSystem = Record<string, number>;

export type DriverWithUser = Driver & {
  user: { id: string; name: string } | null;
};

export type DriverWithMembership = Driver & {
  championshipDriver: ChampionshipDriver;
};

export type RaceWithResults = Race & {
  results: (RaceResult & { driver: Driver })[];
};

export type ChampionshipFull = Championship & {
  drivers: (ChampionshipDriver & { driver: DriverWithUser })[];
  races: RaceWithResults[];
};

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
  perRound: (RoundCell | null)[];
  position: number;
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
