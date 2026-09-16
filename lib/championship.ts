import { db } from "@/lib/db";
import { DomainError } from "@/lib/api";
import type { ChampionshipFull } from "@/types";

const fullInclude = {
  drivers: { include: { driver: true }, orderBy: { joinedAt: "asc" as const } },
  races: {
    include: { results: { include: { driver: true } } },
    orderBy: { roundNumber: "asc" as const },
  },
};

export async function getChampionshipFull(id: string): Promise<ChampionshipFull> {
  const championship = await db.championship.findUnique({ where: { id }, include: fullInclude });
  if (!championship) throw new DomainError("Championship not found", 404);
  return championship as unknown as ChampionshipFull;
}

export function championshipInclude() {
  return fullInclude;
}
