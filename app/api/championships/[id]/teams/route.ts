import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/session";

// V2 spec section 10: teams are championship-scoped, never a permanent
// driver attribute — this route only ever operates within one championshipId.

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return apiHandler(async () => {
    await requireUser();

    const [teams, championshipDrivers, driverTeams] = await Promise.all([
      db.team.findMany({ where: { championshipId: params.id }, orderBy: { name: "asc" } }),
      db.championshipDriver.findMany({
        where: { championshipId: params.id },
        include: { driver: true },
        orderBy: { driver: { name: "asc" } },
      }),
      db.championshipDriverTeam.findMany({ where: { championshipId: params.id } }),
    ]);

    const teamByDriverId = new Map(driverTeams.map((dt) => [dt.driverId, dt.teamId]));

    const roster = championshipDrivers.map((cd) => ({
      driverId: cd.driverId,
      name: cd.driver.name,
      nickname: cd.driver.nickname,
      carColour: cd.driver.carColour,
      avatarUrl: cd.driver.avatarUrl,
      teamId: teamByDriverId.get(cd.driverId) ?? null,
    }));

    return NextResponse.json({ teams, roster });
  });
}

const createTeamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(60),
  abbreviation: z.string().trim().min(1, "Abbreviation is required").max(6),
  colour: z.string().min(1),
  logoUrl: z.string().url().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return apiHandler(async () => {
    await requireAdmin();
    const input = createTeamSchema.parse(await req.json());

    const championship = await db.championship.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!championship) throw new DomainError("Championship not found", 404);

    const team = await db.team.create({
      data: {
        championshipId: params.id,
        name: input.name,
        abbreviation: input.abbreviation.toUpperCase(),
        colour: input.colour,
        logoUrl: input.logoUrl || null,
      },
    });

    return NextResponse.json({ team }, { status: 201 });
  });
}
