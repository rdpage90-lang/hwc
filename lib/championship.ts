import { db } from "@/lib/db";
import { DomainError } from "@/lib/api";
import type { ChampionshipFull } from "@/types";

const fullInclude = {
  drivers: {
    include: { driver: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: { joinedAt: "asc" as const },
  },
  races: {
    include: { results: { include: { driver: true } } },
    orderBy: { roundNumber: "asc" as const },
  },
  // V2: championship-scoped teams, plus every driver's team assignment for
  // this championship. Cheap to always include — most championships will
  // have zero or a handful of teams, and computeConstructorStandings
  // already treats an empty teams array as "no constructors' table yet"
  // rather than an error.
  teams: {
    orderBy: { name: "asc" as const },
  },
  driverTeams: true,
};

export async function getChampionshipFull(id: string): Promise<ChampionshipFull> {
  const championship = await db.championship.findUnique({ where: { id }, include: fullInclude });
  if (!championship) throw new DomainError("Championship not found", 404);
  return championship as unknown as ChampionshipFull;
}

export function championshipInclude() {
  return fullInclude;
}
