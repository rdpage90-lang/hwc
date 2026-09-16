import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { getChampionshipFull } from "@/lib/championship";
import { computeStandings } from "@/lib/scoring";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return apiHandler(async () => {
    await requireUser();
    const championship = await getChampionshipFull(params.id);
    const standings = computeStandings(championship);
    return NextResponse.json({ championship, standings });
  });
}
