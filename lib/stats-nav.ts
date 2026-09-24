export interface StatsLink {
  href: string;
  label: string;
  description: string;
}

// Add to this list as Phase 3 grows (track history, filterable race archive,
// etc.) — Nav.tsx and app/stats/page.tsx both read from here, so nothing
// else needs to change when a new stats page ships.
export const STATS_LINKS: StatsLink[] = [
  { href: "/archive", label: "Archive", description: "Every completed season, permanently on record" },
  { href: "/stats/leaderboard", label: "All-time standings", description: "Every driver, ranked by career points" },
  { href: "/stats/head-to-head", label: "Head-to-head", description: "Compare any two drivers across every race they've shared" },
  { href: "/stats/tracks", label: "Track history", description: "Every track raced at, with records and results by driver" },
  { href: "/stats/races", label: "Race archive", description: "Every race ever entered, filterable by championship, driver, track or team" },
  { href: "/stats/records", label: "Records", description: "Driver and race records, calculated fresh from every result" },
  { href: "/stats/hall-of-fame", label: "Hall of Fame", description: "Top 3 in every category" },
];
