import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiHandler, DomainError } from "@/lib/api";
import { getNextAvailableDriverNumber } from "@/lib/driver-numbers";

export async function GET() {
  return apiHandler(async () => {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      throw new DomainError("Admin access required", 403);
    }

    const nextAvailable = await getNextAvailableDriverNumber();
    return NextResponse.json({ nextAvailable });
  });
}
