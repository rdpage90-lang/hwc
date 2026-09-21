import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

// V2 migration path for existing V1 drivers (V2 spec section 42):
// "If no number is known, temporary unique numbers can be assigned and
// later changed through admin settings." This fills every gap driver by
// driver (name order) so results are deterministic and re-running it is
// a no-op once nothing is unassigned.
export async function POST() {
  return apiHandler(async () => {
    await requireAdmin();

    const unassigned = await db.driver.findMany({
      where: { driverNumber: null },
      orderBy: { name: "asc" },
      select: { id: true },
    });

    if (unassigned.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    const taken = await db.driver.findMany({
      where: { driverNumber: { not: null } },
      select: { driverNumber: true },
    });
    const takenNumbers = new Set(taken.map((d) => d.driverNumber as number));

    const assignments: { id: string; driverNumber: number }[] = [];
    let candidate = 1;
    for (const driver of unassigned) {
      while (takenNumbers.has(candidate)) candidate++;
      assignments.push({ id: driver.id, driverNumber: candidate });
      takenNumbers.add(candidate);
      candidate++;
    }

    await db.$transaction(
      assignments.map((a) =>
        db.driver.update({ where: { id: a.id }, data: { driverNumber: a.driverNumber } })
      )
    );

    return NextResponse.json({ updated: assignments.length, assignments });
  });
}
