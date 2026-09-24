import type { ChampionshipProgression } from "@/lib/progression";

// Fixed palette, assigned by index (not by car colour) so two drivers who
// happen to share the same named carColour still get visually distinct
// lines — readability matters more here than matching the avatar dot.
const PALETTE = ["#ff4d4d", "#4da6ff", "#ffd24d", "#4dff88", "#ff9f4d", "#b84dff", "#4dfff2", "#ff4da6", "#9fff4d", "#4d5eff"];

const WIDTH = 640;
const HEIGHT = 240;
const PAD_LEFT = 30;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;

function buildPath(values: (number | null)[], toXY: (i: number, v: number) => [number, number]): string {
  let d = "";
  let drawing = false;
  values.forEach((v, i) => {
    if (v == null) {
      drawing = false; // gap for rounds before this driver joined — no line drawn back to the origin
      return;
    }
    const [x, y] = toXY(i, v);
    d += drawing ? ` L ${x} ${y}` : `M ${x} ${y}`;
    drawing = true;
  });
  return d;
}

export function ProgressionCharts({ progression }: { progression: ChampionshipProgression }) {
  const { rounds, series } = progression;

  if (rounds.length < 2) {
    return <p className="text-sm text-track-400">Progression graphs need at least two completed rounds.</p>;
  }

  const xStep = PLOT_W / (rounds.length - 1);
  const xAt = (i: number) => PAD_LEFT + i * xStep;

  const maxPoints = Math.max(1, ...series.flatMap((s) => s.points.filter((p): p is number => p != null)));
  const pointsY = (v: number) => PAD_TOP + PLOT_H - (v / maxPoints) * PLOT_H;

  const maxPosition = Math.max(1, series.length);
  const positionY = (v: number) => PAD_TOP + ((v - 1) / Math.max(1, maxPosition - 1)) * PLOT_H;

  return (
    <div className="space-y-6">
      <div>
        <div className="hud-tick mb-2">Points progression</div>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
          <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + PLOT_H} className="stroke-track-700" />
          <line x1={PAD_LEFT} y1={PAD_TOP + PLOT_H} x2={WIDTH - PAD_RIGHT} y2={PAD_TOP + PLOT_H} className="stroke-track-700" />
          <text x={PAD_LEFT - 6} y={PAD_TOP + 4} textAnchor="end" className="fill-track-500 text-[9px]">
            {maxPoints}
          </text>
          <text x={PAD_LEFT - 6} y={PAD_TOP + PLOT_H} textAnchor="end" className="fill-track-500 text-[9px]">
            0
          </text>
          {rounds.map((r, i) => (
            <text key={r} x={xAt(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-track-500 text-[9px]">
              R{r}
            </text>
          ))}
          {series.map((s, idx) => (
            <path
              key={s.driverId}
              d={buildPath(s.points, (i, v) => [xAt(i), pointsY(v)])}
              fill="none"
              stroke={PALETTE[idx % PALETTE.length]}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>

      <div>
        <div className="hud-tick mb-2">Championship position</div>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
          <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + PLOT_H} className="stroke-track-700" />
          <line x1={PAD_LEFT} y1={PAD_TOP + PLOT_H} x2={WIDTH - PAD_RIGHT} y2={PAD_TOP + PLOT_H} className="stroke-track-700" />
          <text x={PAD_LEFT - 6} y={PAD_TOP + 4} textAnchor="end" className="fill-track-500 text-[9px]">
            P1
          </text>
          <text x={PAD_LEFT - 6} y={PAD_TOP + PLOT_H} textAnchor="end" className="fill-track-500 text-[9px]">
            P{maxPosition}
          </text>
          {rounds.map((r, i) => (
            <text key={r} x={xAt(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-track-500 text-[9px]">
              R{r}
            </text>
          ))}
          {series.map((s, idx) => (
            <path
              key={s.driverId}
              d={buildPath(s.position, (i, v) => [xAt(i), positionY(v)])}
              fill="none"
              stroke={PALETTE[idx % PALETTE.length]}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map((s, idx) => (
          <div key={s.driverId} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
            <span className="text-xs text-track-300">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
