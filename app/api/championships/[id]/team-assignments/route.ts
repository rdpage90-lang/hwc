import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

// A driver having no ChampionshipDriverTeam row means "unassigned" — teamId
// on the model itself is required, so unassigning deletes the row rather
// than setting it null (V2 spec section 10: one row per driver per
// championship, at most).
const assignTeamSchema = z.object({
  driverId: z.string().cuid(),
  teamId: z.string().cuid().nullable(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return apiHandler(async () => {
    await requireAdmin();
    const input = assignTeamSchema.parse(await req.json());

    const championshipDriver = await db.championshipDriver.findUnique({
      where: { championshipId_driverId: { championshipId: params.id, driverId: input.driverId } },
    });
    if (!championshipDriver) {
      throw new DomainError("That driver isn't registered for this championship.", 404);
    }

    if (input.teamId === null) {
      await db.championshipDriverTeam.deleteMany({
        where: { championshipId: params.id, driverId: input.driverId },
      });
      return NextResponse.json({ teamId: null });
    }

    const team = await db.team.findUnique({ where: { id: input.teamId } });
    if (!team || team.championshipId !== params.id) {
      throw new DomainError("That team doesn't belong to this championship.", 400);
    }

    const assignment = await db.championshipDriverTeam.upsert({
      where: { championshipId_driverId: { championshipId: params.id, driverId: input.driverId } },
      create: { championshipId: params.id, driverId: input.driverId, teamId: input.teamId },
      update: { teamId: input.teamId },
    });

    return NextResponse.json({ teamId: assignment.teamId });
  });
}
