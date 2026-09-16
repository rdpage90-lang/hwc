import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireUser } from "@/lib/session";

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
