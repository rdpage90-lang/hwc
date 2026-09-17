"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, DriverAvatar } from "@/components/ui";
import { UserLinkedNameField } from "@/components/UserLinkedNameField";

interface Driver {
  id: string;
  name: string;
  nickname: string | null;
  carColour: string;
  avatarUrl: string | null;
}

const CAR_COLOURS = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Black", "White", "Pink", "Cyan"];

export function AddDriverForm({ championshipId, existingDriverIds }: { championshipId: string; existingDriverIds: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roster, setRoster] = useState<Driver[]>([]);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [newColour, setNewColour] = useState<string>(CAR_COLOURS[0] ?? "Red");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/drivers")
      .then((r) => r.json())
      .then((d) => setRoster((d.drivers ?? []).filter((dr: Driver) => !existingDriverIds.includes(dr.id))));
  }, [open, existingDriverIds]);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const body =
        mode === "existing"
          ? { driverId: selectedId }
          : { newDriver: { name: newName, carColour: newColour, userId: newUserId || undefined } };
      if (mode === "existing" && !selectedId) throw new Error("Pick a driver to add.");
      if (mode === "new" && !newName.trim()) throw new Error("Give the new driver a name.");

      const res = await fetch(`/api/championships/${championshipId}/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't add that driver.");

      setOpen(false);
      setSelectedId("");
      setNewName("");
      setNewUserId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that driver.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Add driver
      </Button>
    );
  }

  return (
    <Card>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`text-xs font-mono uppercase tracking-wideish px-3 py-1.5 border ${mode === "existing" ? "border-heat text-white" : "border-track-600 text-track-400"}`}
        >
          Existing driver
        </button>
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`text-xs font-mono uppercase tracking-wideish px-3 py-1.5 border ${mode === "new" ? "border-heat text-white" : "border-track-600 text-track-400"}`}
        >
          New driver
        </button>
      </div>

      {mode === "existing" ? (
        roster.length === 0 ? (
          <p className="text-sm text-track-400">Every driver on your roster is already in this championship.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {roster.map((d) => (
              <button
                type="button"
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`flex items-center gap-2 px-2.5 py-2 border text-left ${selectedId === d.id ? "border-heat bg-heat/10" : "border-track-600 hover:border-track-400"}`}
              >
                <DriverAvatar name={d.name} carColour={d.carColour} avatarUrl={d.avatarUrl} size={24} />
                <span className="text-sm text-white truncate">{d.nickname || d.name}</span>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="flex gap-2 items-end">
          <label className="flex-1 block">
            <span className="hud-tick block mb-1.5">Name</span>
            <UserLinkedNameField
              name={newName}
              userId={newUserId}
              onChange={(n, uid) => {
                setNewName(n);
                setNewUserId(uid);
              }}
            />
          </label>
          <label className="block">
            <span className="hud-tick block mb-1.5">Colour</span>
            <select value={newColour} onChange={(e) => setNewColour(e.target.value)} className="bg-track-850 border border-track-600 px-3 py-2 text-white text-sm">
              {CAR_COLOURS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <p className="text-xs text-track-500 mt-4">
        This driver&apos;s championship record will start at the next round — earlier rounds show as not-yet-joined rather than a missed race.
      </p>

      {error && <p className="text-sm text-signal-red mt-2">{error}</p>}

      <div className="flex gap-3 mt-4">
        <Button size="sm" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Adding…" : "Add to championship"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
