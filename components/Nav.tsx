"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/championships", label: "Championships", icon: FlagIcon },
  { href: "/drivers", label: "Drivers", icon: DriverIcon },
  { href: "/archive", label: "Archive", icon: ArchiveIcon },
];

export function Nav({ role, name }: { role: "ADMIN" | "PLAYER"; name: string }) {
  const pathname = usePathname();
  const links = role === "ADMIN" ? [...LINKS, { href: "/admin/users", label: "Admin", icon: AdminIcon }] : LINKS;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

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
            {links.map((l) => (
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

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-track-950/95 backdrop-blur border-t border-track-700 flex items-stretch">
        {links.map((l) => {
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
function ArchiveIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <rect x="3" y="4" width="18" height="4" />
      <path d="M5 8v11h14V8" />
      <path d="M10 12h4" />
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
