import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { submitRaceResultsSchema } from "@/lib/validations";
import { getChampionshipFull } from "@/lib/championship";
import { computeStandings, pointsFor } from "@/lib/scoring";
import type { PointsSystem } from "@/types";

// POST /api/championships/:champId/races/:raceId/results
//
// This is the one and only way a race result ever gets written (spec
// section 15) and the one and only way a race gets marked COMPLETED
// (section 14/26). Everything here is enforced again at the database
// layer by prisma/triggers.sql, so even a bug in this handler can't
// produce an editable result.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; raceId: string } },
) {
  return apiHandler(async () => {
    const admin = await requireAdmin();
    const body = await req.json();
    const input = submitRaceResultsSchema.parse(body);

    const championship = await getChampionshipFull(params.id);
    const race = championship.races.find((r) => r.id === params.raceId);
    if (!race) throw new DomainError("Race not found", 404);

    // --- Section 13: result validation, applied before anything is written ---

    if (race.status === "COMPLETED") {
      throw new DomainError("This race has already been completed and its result is locked.");
    }
    if (race.status !== "OPEN") {
      throw new DomainError(
        "This race isn't open for results yet. Only the next scheduled race can be completed.",
      );
    }

    const eligibleDrivers = championship.drivers.filter((cd) => cd.joinedRound <= race.roundNumber);
    const eligibleIds = new Set(eligibleDrivers.map((cd) => cd.driverId));

    const submittedIds = input.results.map((r) => r.driverId);
    const submittedIdSet = new Set(submittedIds);

    if (submittedIds.length !== submittedIdSet.size) {
      throw new DomainError("A driver appears more than once in these results.");
    }
    for (const id of submittedIds) {
      if (!eligibleIds.has(id)) {
        throw new DomainError("One of these drivers isn't eligible for this race.");
      }
    }
    for (const id of eligibleIds) {
      if (!submittedIdSet.has(id)) {
        throw new DomainError("Every driver in the championship needs a result before you submit.");
      }
    }

    const finishers = input.results.filter((r) => r.resultStatus === "FINISHED");
    for (const r of input.results) {
      const hasPosition = r.finishingPosition != null;
      if (r.resultStatus === "FINISHED" && !hasPosition) {
        throw new DomainError("Every finishing driver needs a finishing position.");
      }
      if (r.resultStatus !== "FINISHED" && hasPosition) {
        throw new DomainError("DNF and DNS drivers can't have a finishing position.");
      }
    }
    const positions = finishers
      .map((f) => f.finishingPosition as number)
      .sort((a, b) => a - b);
    const expected = positions.map((_, i) => i + 1);
    const sequential = positions.every((p, i) => p === expected[i]);
    if (!sequential) {
      throw new DomainError("Finishing positions must be sequential starting at 1, with no gaps or repeats.");
    }

    // --- Write the result, advance the calendar, and (if this was the
    // final round) complete the championship — all in one transaction. ---

    const pointsSystem = championship.pointsSystem as PointsSystem;
    const now = new Date();

    const updated = await db.$transaction(async (tx) => {
      for (const r of input.results) {
        const points = pointsFor(pointsSystem, r.resultStatus, r.finishingPosition);
        await tx.raceResult.create({
          data: {
            raceId: race.id,
            driverId: r.driverId,
            resultStatus: r.resultStatus,
            finishingPosition: r.resultStatus === "FINISHED" ? r.finishingPosition : null,
            championshipPoints: points,
            submittedById: admin.id,
            submittedAt: now,
          },
        });
      }

      await tx.race.update({
        where: { id: race.id },
        data: { status: "COMPLETED", submittedById: admin.id, submittedAt: now },
      });

      const nextRace = championship.races.find((r) => r.roundNumber === race.roundNumber + 1);
      const isFinalRound = race.roundNumber === championship.numberOfRaces || !nextRace;

      if (!isFinalRound && nextRace) {
        await tx.race.update({ where: { id: nextRace.id }, data: { status: "OPEN" } });
      }

      let championDriverId: string | null = null;
      if (isFinalRound) {
        // Re-fetch with the just-written result included so the champion
        // is resolved from complete data (spec section 26).
        const fresh = await tx.championship.findUniqueOrThrow({
          where: { id: championship.id },
          include: {
            drivers: { include: { driver: true } },
            races: { include: { results: { include: { driver: true } } }, orderBy: { roundNumber: "asc" } },
          },
        });
        const standings = computeStandings(fresh as any);
        championDriverId = standings[0]?.driverId ?? null;

        await tx.championship.update({
          where: { id: championship.id },
          data: { status: "COMPLETED", completedAt: now, championDriverId },
        });
      }

      return { isFinalRound, championDriverId };
    });

    return NextResponse.json({
      raceId: race.id,
      championshipCompleted: updated.isFinalRound,
      championDriverId: updated.championDriverId,
    });
  });
}
