import { db } from "@/lib/db";

/**
 * Smallest positive integer not currently assigned to any driver.
 * Kept deliberately simple (fills gaps rather than just incrementing a
 * counter) — it's a suggestion, admin can always type a different number.
 */
export async function getNextAvailableDriverNumber(): Promise<number> {
  const taken = await db.driver.findMany({
    where: { driverNumber: { not: null } },
    select: { driverNumber: true },
  });
  const takenNumbers = new Set(taken.map((d) => d.driverNumber as number));

  let candidate = 1;
  while (takenNumbers.has(candidate)) candidate++;
  return candidate;
}
