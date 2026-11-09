import type { Team } from "@prisma/client";
import type { ChampionshipFull } from "@/types";

/**
 * driverId -> Team for one championship. A driver with no assignment is
 * simply absent from the map (teams are optional), so callers just check
 * `map.get(driverId)` and show nothing when it's undefined.
 */
export function getTeamByDriverId(championship: ChampionshipFull): Map<string, Team> {
  const teamsById = new Map(championship.teams.map((t) => [t.id, t]));
  const byDriver = new Map<string, Team>();
  for (const assignment of championship.driverTeams) {
    const team = teamsById.get(assignment.teamId);
    if (team) byDriver.set(assignment.driverId, team);
  }
  return byDriver;
}
