import clsx from "clsx";
import type { Race } from "@prisma/client";

export function ChampionshipProgress({ races }: { races: Race[] }) {
  const sorted = [...races].sort((a, b) => a.roundNumber - b.roundNumber);

  return (
    <div className="flex items-center gap-4 mt-3 overflow-x-auto telemetry-scroll pb-1">
      <div className="flex items-center">
        {sorted.map((race, i) => (
          <div key={race.id} className="flex items-center">
            <Dot status={race.status} />
            {i < sorted.length - 1 && (
              <div className={clsx("h-px w-5 md:w-7", race.status === "COMPLETED" ? "bg-heat" : "bg-track-600")} />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-1 shrink-0">
        {sorted.map((r) => (
          <span key={r.id} className="hud-tick w-6 md:w-7 text-center">
            R{r.roundNumber}
          </span>
        ))}
      </div>
    </div>
  );
}

function Dot({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <div className="w-3.5 h-3.5 rounded-full bg-heat flex items-center justify-center shrink-0" title="Completed">
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M1 5l3 3 5-6" stroke="#07090d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (status === "OPEN") {
    return <div className="w-3.5 h-3.5 rounded-full bg-track-950 border-2 border-heat animate-pulse-glow shrink-0" title="Next race" />;
  }
  return <div className="w-3 h-3 rounded-full border border-track-600 shrink-0" title="Upcoming" />;
}
