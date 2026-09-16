import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { addDriverToChampionshipSchema } from "@/lib/validations";

// POST /api/championships/:id/drivers — add an existing driver, or create
// and add a brand-new one, to an in-progress championship.
//
// Late-join rule (spec section 8): the driver's championship record starts
// at the round *after* whichever round is currently open/in-progress. They
// receive no points, and no DNS, for any earlier round — those rounds
// render as "—" rather than a missed race (see lib/scoring.ts).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return apiHandler(async () => {
    await requireAdmin();
    const body = await req.json();
    const input = addDriverToChampionshipSchema.parse(body);

    if (!input.driverId && !input.newDriver) {
      throw new DomainError("Provide either an existing driverId or a newDriver to create.");
    }

    const championship = await db.championship.findUnique({
      where: { id: params.id },
      include: { races: { orderBy: { roundNumber: "asc" } } },
    });
    if (!championship) throw new DomainError("Championship not found", 404);
    if (championship.status === "COMPLETED") {
      throw new DomainError("This championship is completed and can no longer be modified.");
    }

    const openRace = championship.races.find((r) => r.status === "OPEN");
    const lastCompletedRound = championship.races
      .filter((r) => r.status === "COMPLETED")
      .reduce((max, r) => Math.max(max, r.roundNumber), 0);
    const joinedRound = openRace ? openRace.roundNumber + 1 : lastCompletedRound + 1;

    const result = await db.$transaction(async (tx) => {
      let driverId = input.driverId ?? null;

      if (!driverId && input.newDriver) {
        const driver = await tx.driver.create({
          data: {
            name: input.newDriver.name,
            nickname: input.newDriver.nickname || null,
            carColour: input.newDriver.carColour,
            avatarUrl: input.newDriver.avatarUrl || null,
          },
        });
        driverId = driver.id;
      }

      if (!driverId) throw new DomainError("Could not resolve a driver to add.");

      const existing = await tx.championshipDriver.findUnique({
        where: { championshipId_driverId: { championshipId: params.id, driverId } },
      });
      if (existing) throw new DomainError("This driver is already in the championship.");

      return tx.championshipDriver.create({
        data: { championshipId: params.id, driverId, joinedRound },
        include: { driver: true },
      });
    });

    return NextResponse.json({ championshipDriver: result }, { status: 201 });
  });
}
