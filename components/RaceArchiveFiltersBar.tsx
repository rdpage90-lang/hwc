"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { RaceArchiveFilterOptions } from "@/lib/race-archive";

const FILTER_KEYS = ["championship", "year", "driver", "track", "team"] as const;

export function RaceArchiveFiltersBar({ options }: { options: RaceArchiveFilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = FILTER_KEYS.some((k) => searchParams.get(k));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <select value={searchParams.get("championship") ?? ""} onChange={(e) => setParam("championship", e.target.value)} className="input text-xs">
          <option value="">Any championship</option>
          {options.championships.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={searchParams.get("year") ?? ""} onChange={(e) => setParam("year", e.target.value)} className="input text-xs">
          <option value="">Any year</option>
          {options.years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select value={searchParams.get("driver") ?? ""} onChange={(e) => setParam("driver", e.target.value)} className="input text-xs">
          <option value="">Any driver</option>
          {options.drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select value={searchParams.get("track") ?? ""} onChange={(e) => setParam("track", e.target.value)} className="input text-xs">
          <option value="">Any track</option>
          {options.tracks.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={searchParams.get("team") ?? ""} onChange={(e) => setParam("team", e.target.value)} className="input text-xs">
          <option value="">Any team</option>
          {options.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.championshipName}
            </option>
          ))}
        </select>
      </div>
      {hasFilters && (
        <button type="button" onClick={() => router.push(pathname)} className="text-xs text-track-400 hover:text-signal-red">
          Clear filters
        </button>
      )}
    </div>
  );
}
