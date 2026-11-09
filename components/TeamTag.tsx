// Team colours are the same named palette as car colours ("Red", "Cyan", ...),
// which are all valid CSS colour names, so they can be used directly. The
// thin border keeps "Black" and "White" visible against the dark theme.
export function TeamTag({
  team,
  className,
}: {
  team: { name: string; abbreviation: string; colour: string };
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`} title={team.name}>
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 border border-track-600"
        style={{ backgroundColor: team.colour.toLowerCase() }}
        aria-hidden
      />
      <span className="hud-tick">{team.abbreviation}</span>
    </span>
  );
}
