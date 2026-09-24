import Link from "next/link";
import { Card } from "@/components/ui";
import { STATS_LINKS } from "@/lib/stats-nav";

export default function StatsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">Stats</h1>
        <p className="text-sm text-track-400 mt-1">Career standings, records, and every completed season on record.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {STATS_LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="hover:border-track-400 transition-colors h-full">
              <h3 className="text-lg text-white mb-1.5">{l.label}</h3>
              <p className="text-sm text-track-400">{l.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
