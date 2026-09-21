import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { getNextAvailableDriverNumber } from "@/lib/driver-numbers";

export async function GET() {
  return apiHandler(async () => {
    await requireAdmin();

    const nextAvailable = await getNextAvailableDriverNumber();
    return NextResponse.json({ nextAvailable });
  });
}
