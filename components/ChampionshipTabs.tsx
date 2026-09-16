"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function ChampionshipTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/championships/${id}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/standings`, label: "Standings" },
    { href: `${base}/races`, label: "Races" },
    { href: `${base}/drivers`, label: "Drivers" },
  ];

  return (
    <div className="flex gap-1 border-b border-track-700 overflow-x-auto telemetry-scroll">
      {tabs.map((t) => {
        const active = t.href === base ? pathname === base : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "px-4 py-2.5 text-sm font-display font-semibold uppercase tracking-wideish border-b-2 whitespace-nowrap transition-colors",
              active ? "text-white border-heat" : "text-track-400 border-transparent hover:text-track-300",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
