import { db } from "@/lib/db";

export interface RaceArchiveFilterOptions {
  championships: { id: string; name: string; year: number }[];
  years: number[];
  drivers: { id: string; name: string }[];
  tracks: string[];
  teams: { id: string; name: string; championshipName: string }[];
}

export async function getRaceArchiveFilterOptions(): Promise<RaceArchiveFilterOptions> {
  const [championships, drivers, tracks, teams] = await Promise.all([
    db.championship.findMany({ select: { id: true, name: true, year: true }, orderBy: [{ year: "desc" }, { name: "asc" }] }),
    db.driver.findMany({
      where: { results: { some: {} } },
      select: { id: true, name: true, nickname: true },
      orderBy: { name: "asc" },
    }),
    db.race.findMany({ where: { status: "COMPLETED" }, select: { trackName: true }, distinct: ["trackName"] }),
    db.team.findMany({
      select: { id: true, name: true, championship: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    championships,
    years: [...new Set(championships.map((c) => c.year))].sort((a, b) => b - a),
    drivers: drivers.map((d) => ({ id: d.id, name: d.nickname || d.name })),
    tracks: [...new Set(tracks.map((t) => t.trackName))].sort((a, b) => a.localeCompare(b)),
    teams: teams.map((t) => ({ id: t.id, name: t.name, championshipName: t.championship.name })),
  };
}

export interface RaceArchiveFilters {
  championshipId?: string;
  year?: number;
  driverId?: string;
  trackName?: string;
  teamId?: string;
}

export interface RaceArchiveResult {
  id: string;
  championshipId: string;
  championshipName: string;
  year: number;
  roundNumber: number;
  trackName: string;
}

/** Every completed race matching the given filters — "each race opens its permanent historical result" per spec section 20. */
export async function searchRaceArchive(filters: RaceArchiveFilters): Promise<RaceArchiveResult[]> {
  // A specific driver filter takes priority over a team filter if both are
  // somehow set at once; otherwise a team filter expands to every driver
  // who was ever assigned to that team (championship-scoped, so this stays
  // correct even though teams aren't a permanent driver attribute).
  let driverIdFilter: string[] | undefined;
  if (filters.driverId) {
    driverIdFilter = [filters.driverId];
  } else if (filters.teamId) {
    const assignments = await db.championshipDriverTeam.findMany({
      where: { teamId: filters.teamId },
      select: { driverId: true },
    });
    driverIdFilter = assignments.map((a) => a.driverId);
  }

  const races = await db.race.findMany({
    where: {
      status: "COMPLETED",
      championshipId: filters.championshipId,
      trackName: filters.trackName,
      championship: filters.year ? { year: filters.year } : undefined,
      results: driverIdFilter ? { some: { driverId: { in: driverIdFilter } } } : undefined,
    },
    include: { championship: { select: { id: true, name: true, year: true } } },
    orderBy: [{ championship: { year: "desc" } }, { roundNumber: "asc" }],
  });

  return races.map((r) => ({
    id: r.id,
    championshipId: r.championshipId,
    championshipName: r.championship.name,
    year: r.championship.year,
    roundNumber: r.roundNumber,
    trackName: r.trackName,
  }));
}
