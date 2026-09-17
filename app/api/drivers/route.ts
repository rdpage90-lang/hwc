import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/session";
import { createDriverSchema } from "@/lib/validations";

// GET /api/drivers — every signed-in user can browse the driver roster
// (spec section 3: players can "View driver profiles").
export async function GET() {
  return apiHandler(async () => {
    await requireUser();
    const drivers = await db.driver.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ drivers });
  });
}

// POST /api/drivers — admin only. Drivers are created independently of any
// championship (spec section 7) so they can be reused across seasons.
export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    await requireAdmin();
    const body = await req.json();
    const input = createDriverSchema.parse(body);

    if (input.userId) {
      const alreadyLinked = await db.driver.findUnique({ where: { userId: input.userId } });
      if (alreadyLinked) throw new DomainError("That user is already linked to another driver.");
    }

    const driver = await db.driver.create({
      data: {
        name: input.name,
        nickname: input.nickname || null,
        carColour: input.carColour,
        avatarUrl: input.avatarUrl || null,
        userId: input.userId || null,
      },
    });

    return NextResponse.json({ driver }, { status: 201 });
  });
}
