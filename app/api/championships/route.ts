import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/session";
import { createChampionshipSchema } from "@/lib/validations";
import { defaultPointsSystem } from "@/lib/scoring";

// GET /api/championships?status=ACTIVE — list championships, optionally
// filtered by status. Dashboard uses ?status=ACTIVE, the archive page uses
// ?status=COMPLETED.
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

// POST /api/championships — admin only. Creates the championship, its
// driver roster (existing drivers + any brand-new ones in one step), and
// the full race calendar, per the section 6 creation flow.
export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    await requireAdmin();
    const body = await req.json();
    const input = createChampionshipSchema.parse(body);

    if (input.driverIds.length === 0 && input.newDrivers.length === 0) {
      throw new DomainError("Add at least one driver before creating the championship.");
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

      // Existing drivers selected from the roster
      for (const driverId of input.driverIds) {
        await tx.championshipDriver.create({
          data: { championshipId: created.id, driverId, joinedRound: 1 },
        });
      }

      // Brand-new drivers created inline
      for (const nd of input.newDrivers) {
        const driver = await tx.driver.create({
          data: {
            name: nd.name,
            nickname: nd.nickname || null,
            carColour: nd.carColour,
            avatarUrl: nd.avatarUrl || null,
          },
        });
        await tx.championshipDriver.create({
          data: { championshipId: created.id, driverId: driver.id, joinedRound: 1 },
        });
      }

      // Race calendar — round 1 opens immediately, the rest stay locked
      // until the previous round is completed (spec section 11).
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
