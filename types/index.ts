import type {
  Championship,
  ChampionshipDriver,
  ChampionshipDriverTeam,
  Driver,
  Race,
  RaceResult,
  ResultStatus,
  Team,
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
  // V2: championship-scoped teams and the driver <-> team assignments for
  // this championship (one row per assigned driver — an unassigned driver
  // simply has no matching row here).
  teams: Team[];
  driverTeams: ChampionshipDriverTeam[];
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

// V2 spec section 10-11: constructors' points are always derived from
// driver results, never entered directly — see computeConstructorStandings
// in lib/scoring.ts.
export interface ConstructorStandingRow {
  teamId: string;
  team: Team;
  points: number;
  wins: number;
  podiums: number;
  position: number;
}
