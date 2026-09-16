import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

// DELETE /api/championships/:id/drivers/:driverId
//
// Spec section 3 lists "add/remove drivers" as an admin capability. Because
// submitted results are permanently immutable (section 14), removal is
// only allowed while the driver has no race results recorded yet — this
// undoes a mis-added driver rather than rewriting history. Once they have
// a result on the books, they're part of the permanent record and stay on
// the roster (their car simply won't appear as eligible for future
// rounds if you need them to stop racing — a full "retire" flow is a
// natural V2 addition).
export async function DELETE(_req: Request, { params }: { params: { id: string; driverId: string } }) {
  return apiHandler(async () => {
    await requireAdmin();

    const membership = await db.championshipDriver.findUnique({
      where: { championshipId_driverId: { championshipId: params.id, driverId: params.driverId } },
    });
    if (!membership) throw new DomainError("This driver isn't in the championship.", 404);

    const resultCount = await db.raceResult.count({
      where: { driverId: params.driverId, race: { championshipId: params.id } },
    });
    if (resultCount > 0) {
      throw new DomainError("This driver already has race results recorded and can't be removed from the championship.");
    }

    await db.championshipDriver.delete({ where: { id: membership.id } });

    return NextResponse.json({ removed: true });
  });
}
