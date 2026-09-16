import clsx from "clsx";
import Link from "next/link";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("hud-card p-5", className)}>{children}</div>;
}

export function Button({
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled,
  className,
  children,
}: {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const styles = clsx(
    "inline-flex items-center justify-center gap-2 font-display font-semibold tracking-wideish uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
    size === "sm" ? "text-xs px-3 py-1.5" : "text-sm px-5 py-2.5",
    variant === "primary" && "bg-heat text-track-950 hover:bg-heat-bright shadow-glow",
    variant === "secondary" && "bg-track-800 text-white border border-track-600 hover:border-track-400",
    variant === "ghost" && "text-track-300 hover:text-white",
    variant === "danger" && "bg-signal-red/10 text-signal-red border border-signal-red/40 hover:bg-signal-red/20",
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={styles}>
      {children}
    </button>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "heat" | "volt" | "amber" | "red";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "border-track-600 text-track-300",
    heat: "border-heat/50 text-heat-bright",
    volt: "border-volt/50 text-volt-bright",
    amber: "border-signal-amber/50 text-signal-amber",
    red: "border-signal-red/50 text-signal-red",
  };
  return <span className={clsx("pill", tones[tone])}>{children}</span>;
}

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="hud-card p-4">
      <div className="hud-tick mb-1.5">{label}</div>
      <div className="stat-figure text-2xl md:text-3xl text-white font-bold leading-none">{value}</div>
      {sub && <div className="text-xs text-track-400 mt-1.5">{sub}</div>}
    </div>
  );
}

const RESULT_ICON: Record<string, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function PositionMark({ position, size = "md" }: { position: number | null; size?: "sm" | "md" }) {
  if (position == null) return <span className="text-track-500">—</span>;
  const medal = RESULT_ICON[position];
  return (
    <span className={clsx("font-mono font-bold", size === "md" ? "text-base" : "text-sm")}>
      {medal ?? position}
    </span>
  );
}

export function DriverAvatar({
  name,
  carColour,
  avatarUrl,
  size = 36,
}: {
  name: string;
  carColour: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover border border-track-600"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full border border-white/10 font-display font-bold text-track-950 shrink-0"
      style={{ width: size, height: size, backgroundColor: colourToHex(carColour), fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// Accepts either a free-text colour name or a hex value and returns
// something CSS can render — drivers pick colours as free text (spec
// doesn't constrain this), so we map common names and fall back to a
// neutral swatch for anything unrecognised.
const NAMED: Record<string, string> = {
  red: "#ff3b4e",
  blue: "#2ea8ff",
  green: "#3ddc97",
  yellow: "#ffd23d",
  orange: "#ff8a1f",
  purple: "#b06bff",
  pink: "#ff6bb0",
  black: "#2b3344",
  white: "#e8ecf3",
  grey: "#8b96ab",
  gray: "#8b96ab",
  cyan: "#2ee0e0",
  teal: "#2ee0c4",
};

function colourToHex(colour: string) {
  if (!colour) return "#5c6a83";
  if (colour.startsWith("#")) return colour;
  return NAMED[colour.trim().toLowerCase()] ?? "#5c6a83";
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="hud-card p-10 text-center flex flex-col items-center gap-3">
      <h3 className="text-lg">{title}</h3>
      <p className="text-sm text-track-400 max-w-sm">{body}</p>
      {action}
    </div>
  );
}
