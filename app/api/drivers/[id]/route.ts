import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { auth } from "@/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return apiHandler(async () => {
    await requireUser();

    const driver = await db.driver.findUnique({
      where: { id: params.id },
      include: {
        championships: {
          include: { championship: true },
          orderBy: { joinedAt: "desc" },
        },
      },
    });

    if (!driver) throw new DomainError("Driver not found", 404);

    return NextResponse.json({ driver });
  });
}

// V2: admin-only driver number assignment (V2 spec section 7). Number is
// nullable so admin can clear a mistaken entry; uniqueness is enforced by
// the DB (drivers_driverNumber_key), caught below as a friendly 409 rather
// than a raw Prisma error.
const updateDriverSchema = z.object({
  driverNumber: z.number().int().min(1).max(999).nullable(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return apiHandler(async () => {
    // NOTE: inlined admin check — swap for your existing requireAdmin()
    // helper if you have one, for consistency with the rest of the app.
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      throw new DomainError("Admin access required", 403);
    }

    const body = updateDriverSchema.parse(await req.json());

    try {
      const driver = await db.driver.update({
        where: { id: params.id },
        data: { driverNumber: body.driverNumber },
      });
      return NextResponse.json({ driver });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new DomainError(`Driver number ${body.driverNumber} is already taken`, 409);
      }
      throw err;
    }
  });
}
