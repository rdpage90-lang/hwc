"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import { STATS_LINKS } from "@/lib/stats-nav";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/championships", label: "Championships", icon: FlagIcon },
  { href: "/drivers", label: "Drivers", icon: DriverIcon },
];

export function Nav({ role, name }: { role: "ADMIN" | "PLAYER"; name: string }) {
  const pathname = usePathname();
  const [statsOpen, setStatsOpen] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const adminLink = role === "ADMIN" ? { href: "/admin/users", label: "Admin", icon: AdminIcon } : null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isStatsActive = isActive("/stats") || STATS_LINKS.some((l) => isActive(l.href));

  // Close the dropdown on outside click and on navigation.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (statsRef.current && !statsRef.current.contains(e.target as Node)) setStatsOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);
  useEffect(() => setStatsOpen(false), [pathname]);

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex sticky top-0 z-40 items-center justify-between border-b border-track-700 bg-track-950/90 backdrop-blur px-6 h-16">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-display font-bold text-xl text-white tracking-tightish">HWC</span>
            <span className="hud-tick hidden lg:inline">// HEAT WORLD CHAMPIONSHIP</span>
          </Link>
          <nav className="flex items-center gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "px-3 py-2 text-sm font-medium transition-colors border-b-2",
                  isActive(l.href)
                    ? "text-white border-heat"
                    : "text-track-400 border-transparent hover:text-track-300 hover:border-track-600",
                )}
              >
                {l.label}
              </Link>
            ))}

            <div className="relative" ref={statsRef}>
              <button
                type="button"
                onClick={() => setStatsOpen((v) => !v)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2",
                  isStatsActive
                    ? "text-white border-heat"
                    : "text-track-400 border-transparent hover:text-track-300 hover:border-track-600",
                )}
              >
                Stats
                <ChevronIcon className={clsx("transition-transform", statsOpen && "rotate-180")} />
              </button>
              {statsOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-track-900 border border-track-700 shadow-lg py-1 z-50">
                  {STATS_LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={clsx("block px-3 py-2.5 hover:bg-track-800/60 transition-colors", isActive(l.href) ? "text-white" : "text-track-300")}
                    >
                      <div className="text-sm">{l.label}</div>
                      <div className="text-xs text-track-500 mt-0.5">{l.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {adminLink && (
              <Link
                href={adminLink.href}
                className={clsx(
                  "px-3 py-2 text-sm font-medium transition-colors border-b-2",
                  isActive(adminLink.href)
                    ? "text-white border-heat"
                    : "text-track-400 border-transparent hover:text-track-300 hover:border-track-600",
                )}
              >
                {adminLink.label}
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="hud-tick">{role === "ADMIN" ? "ADMIN" : "PLAYER"} · {name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-track-400 hover:text-signal-red transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile bottom bar — no dropdown room, so Stats just links to the hub page */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-track-950/95 backdrop-blur border-t border-track-700 flex items-stretch">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-mono uppercase tracking-wideish",
                isActive(l.href) ? "text-heat" : "text-track-400",
              )}
            >
              <Icon active={isActive(l.href)} />
              {l.label}
            </Link>
          );
        })}
        <Link
          href="/stats"
          className={clsx(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-mono uppercase tracking-wideish",
            isStatsActive ? "text-heat" : "text-track-400",
          )}
        >
          <StatsIcon active={isStatsActive} />
          Stats
        </Link>
        {adminLink && (
          <Link
            href={adminLink.href}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-mono uppercase tracking-wideish",
              isActive(adminLink.href) ? "text-heat" : "text-track-400",
            )}
          >
            <AdminIcon active={isActive(adminLink.href)} />
            {adminLink.label}
          </Link>
        )}
      </nav>
    </>
  );
}

function DashboardIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <rect x="3" y="3" width="8" height="8" />
      <rect x="13" y="3" width="8" height="5" />
      <rect x="13" y="10" width="8" height="11" />
      <rect x="3" y="13" width="8" height="8" />
    </svg>
  );
}
function FlagIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="M5 21V4" />
      <path d="M5 4h14l-3 4 3 4H5" />
    </svg>
  );
}
function DriverIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
    </svg>
  );
}
function StatsIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
    </svg>
  );
}
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function AdminIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="M12 2l7 3v6c0 5-3 8-7 11-4-3-7-6-7-11V5l7-3z" />
    </svg>
  );
}
