import Link from "next/link";
import { getHallOfFame } from "@/lib/records";
import { Card, EmptyState } from "@/components/ui";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function HallOfFamePage() {
  const { sections } = await getHallOfFame();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">HWC Hall of Fame</h1>
        <p className="text-sm text-track-400 mt-1">Calculated fresh from every result on record — nothing here is stored, only derived.</p>
      </div>

      {sections.map((section) => (
        <Card key={section.label}>
          <h2 className="text-lg mb-3">{section.label}</h2>
          {section.entries.length === 0 ? (
            <EmptyState title="Not yet set" body="No driver has qualified for this category yet." />
          ) : (
            <div className="space-y-2">
              {section.entries.map((entry, i) => (
                <Link
                  key={entry.driverId}
                  href={`/drivers/${entry.driverId}`}
                  className="flex items-center gap-3 py-1.5 hover:bg-track-800/40 transition-colors -mx-2 px-2"
                >
                  <span className="text-lg w-7 shrink-0">{MEDALS[i]}</span>
                  <span className="flex-1 text-sm text-white truncate">{entry.name}</span>
                  <span className="stat-figure text-white font-semibold">{entry.value}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
