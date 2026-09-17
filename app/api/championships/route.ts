import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/session";
import { createChampionshipSchema } from "@/lib/validations";
import { defaultPointsSystem } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    await requireUser();
    const status = req.nextUrl.searchParams.get("status");

    const championships = await db.championship.findMany({
      where: status ? { status: status as "UPCOMING" | "ACTIVE" | "COMPLETED" } : undefined,
      include: {
        drivers: { include: { driver: true } },
        races: { orderBy: { roundNumber: "asc" } },
      },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ championships });
  });
}

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    await requireAdmin();
    const body = await req.json();
    const input = createChampionshipSchema.parse(body);

    if (input.driverIds.length === 0 && input.newDrivers.length === 0) {
      throw new DomainError("Add at least one driver before creating the championship.");
    }

    const requestedUserIds = input.newDrivers.map((nd) => nd.userId).filter((id): id is string => !!id);
    if (new Set(requestedUserIds).size !== requestedUserIds.length) {
      throw new DomainError("You've linked the same user to more than one new driver.");
    }
    if (requestedUserIds.length > 0) {
      const alreadyLinked = await db.driver.findFirst({ where: { userId: { in: requestedUserIds } } });
      if (alreadyLinked) throw new DomainError("One of these users is already linked to another driver.");
    }

    const pointsSystem = { ...defaultPointsSystem(), ...(input.pointsSystem ?? {}) };

    const championship = await db.$transaction(async (tx) => {
      const created = await tx.championship.create({
        data: {
          name: input.name,
          year: input.year,
          numberOfRaces: input.numberOfRaces,
          status: "ACTIVE",
          pointsSystem,
        },
      });

      for (const driverId of input.driverIds) {
        await tx.championshipDriver.create({
          data: { championshipId: created.id, driverId, joinedRound: 1 },
        });
      }

      for (const nd of input.newDrivers) {
        const driver = await tx.driver.create({
          data: {
            name: nd.name,
            nickname: nd.nickname || null,
            carColour: nd.carColour,
            avatarUrl: nd.avatarUrl || null,
            userId: nd.userId || null,
          },
        });
        await tx.championshipDriver.create({
          data: { championshipId: created.id, driverId: driver.id, joinedRound: 1 },
        });
      }

      for (let round = 1; round <= input.numberOfRaces; round++) {
        await tx.race.create({
          data: {
            championshipId: created.id,
            roundNumber: round,
            trackName: input.tracks[round - 1]?.trim() || `Round ${round}`,
            status: round === 1 ? "OPEN" : "UPCOMING",
          },
        });
      }

      return created;
    });

    return NextResponse.json({ championship }, { status: 201 });
  });
}
