"use client";

import { useEffect, useState } from "react";
import { Card, DriverAvatar, Badge, Button } from "@/components/ui";

const TEAM_COLOURS = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Black", "White", "Pink", "Cyan"];

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  colour: string;
}
interface RosterDriver {
  driverId: string;
  name: string;
  nickname: string | null;
  carColour: string;
  avatarUrl: string | null;
  teamId: string | null;
}

export function TeamManagement({ championshipId, isAdmin }: { championshipId: string; isAdmin: boolean }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [roster, setRoster] = useState<RosterDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAbbr, setNewAbbr] = useState("");
  const [newColour, setNewColour] = useState<string>(TEAM_COLOURS[0] ?? "Red");
  const [creatingSubmitting, setCreatingSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingDriverId, setSavingDriverId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/championships/${championshipId}/teams`);
    const data = await res.json();
    setTeams(data.teams ?? []);
    setRoster(data.roster ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [championshipId]);

  async function createTeam() {
    if (!newName.trim() || !newAbbr.trim()) {
      setError("Give the team a name and abbreviation.");
      return;
    }
    setError(null);
    setCreatingSubmitting(true);
    try {
      const res = await fetch(`/api/championships/${championshipId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, abbreviation: newAbbr, colour: newColour }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create that team.");
      setNewName("");
      setNewAbbr("");
      setCreating(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create that team.");
    } finally {
      setCreatingSubmitting(false);
    }
  }

  async function assignTeam(driverId: string, teamId: string | null) {
    setSavingDriverId(driverId);
    setError(null);
    const previous = roster;
    setRoster((prev) => prev.map((r) => (r.driverId === driverId ? { ...r, teamId } : r)));
    try {
      const res = await fetch(`/api/championships/${championshipId}/team-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, teamId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't update that driver's team.");
    } catch (e) {
      setRoster(previous);
      setError(e instanceof Error ? e.message : "Couldn't update that driver's team.");
    } finally {
      setSavingDriverId(null);
    }
  }

  if (loading) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg">Teams</h2>
        {isAdmin && !creating && (
          <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
            + New team
          </Button>
        )}
      </div>

      {isAdmin && creating && (
        <div className="flex gap-2 items-end mb-4 pb-4 border-b border-track-700">
          <label className="block flex-1">
            <span className="hud-tick block mb-1.5">Name</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input" placeholder="Volt Racing" />
          </label>
          <label className="block w-24">
            <span className="hud-tick block mb-1.5">Abbr.</span>
            <input value={newAbbr} onChange={(e) => setNewAbbr(e.target.value)} maxLength={6} className="input" placeholder="VOL" />
          </label>
          <label className="block w-32">
            <span className="hud-tick block mb-1.5">Colour</span>
            <select value={newColour} onChange={(e) => setNewColour(e.target.value)} className="input">
              {TEAM_COLOURS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <Button size="sm" onClick={createTeam} disabled={creatingSubmitting}>
            {creatingSubmitting ? "Creating…" : "Create"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
            Cancel
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-signal-red mb-3">{error}</p>}

      {teams.length === 0 ? (
        <p className="text-sm text-track-400">No teams yet for this championship.</p>
      ) : (
        <div className="space-y-1">
          {roster.map((d) => (
            <div key={d.driverId} className="flex items-center gap-3 py-2">
              <DriverAvatar name={d.name} carColour={d.carColour} avatarUrl={d.avatarUrl} size={28} />
              <span className="flex-1 text-sm text-white truncate">{d.nickname || d.name}</span>
              {isAdmin ? (
                <select
                  value={d.teamId ?? ""}
                  disabled={savingDriverId === d.driverId}
                  onChange={(e) => assignTeam(d.driverId, e.target.value || null)}
                  className="input text-xs w-40"
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.abbreviation})
                    </option>
                  ))}
                </select>
              ) : d.teamId ? (
                <Badge tone="neutral">{teams.find((t) => t.id === d.teamId)?.abbreviation}</Badge>
              ) : (
                <span className="text-xs text-track-500">Unassigned</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
