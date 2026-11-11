import { Card } from "@/components/ui";
import type { RaceReport } from "@/lib/race-report";

export function RaceReportCard({ report }: { report: RaceReport }) {
  return (
    <Card>
      <div className="hud-tick mb-2">Race report</div>
      <h2 className="text-xl font-display font-bold text-white tracking-tightish mb-3">{report.headline}</h2>
      <div className="space-y-2.5">
        {report.paragraphs.map((paragraph, i) => (
          <p key={i} className="text-sm text-track-300 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </Card>
  );
}
