"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, DriverAvatar } from "@/components/ui";

interface Driver {
  id: string;
  name: string;
  nickname: string | null;
  carColour: string;
  avatarUrl: string | null;
}
interface NewDriver {
  name: string;
  nickname: string;
  carColour: string;
}

const CAR_COLOURS = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Black", "White", "Pink", "Cyan"];

export default function NewChampionshipPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newDrivers, setNewDrivers] = useState<NewDriver[]>([]);
  const [draftName, setDraftName] = useState("");
  const [draftColour, setDraftColour] = useState(CAR_COLOURS[0]);

  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [numberOfRaces, setNumberOfRaces] = useState(8);
  const [tracks, setTracks] = useState<string[]>(Array(8).fill(""));

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/drivers")
      .then((r) => r.json())
      .then((d) => setDrivers(d.drivers ?? []));
  }, []);

  useEffect(() => {
    setTracks((prev) => {
      const next = Array(numberOfRaces).fill("");
      prev.forEach((t, i) => {
        if (i < numberOfRaces) next[i] = t;
      });
      return next;
    });
  }, [numberOfRaces]);

  function toggleDriver(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addDraftDriver() {
    if (!draftName.trim()) return;
    setNewDrivers((prev) => [...prev, { name: draftName.trim(), nickname: "", carColour: draftColour }]);
    setDraftName("");
  }

  function removeNewDriver(idx: number) {
    setNewDrivers((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalDriverCount = selected.size + newDrivers.length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Give the championship a name.");
    if (totalDriverCount === 0) return setError("Add at least one driver.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/championships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          year,
          numberOfRaces,
          driverIds: Array.from(selected),
          newDrivers: newDrivers.map((d) => ({ name: d.name, nickname: d.nickname || undefined, carColour: d.carColour })),
          tracks,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      router.push(`/championships/${data.championship.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
      <h1 className="text-2xl mb-1">Create championship</h1>
      <p className="text-sm text-track-400 mb-6">Name it, add your drivers, and build the calendar. Round 1 opens the moment you save.</p>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <h2 className="text-base mb-4">Championship</h2>
          <div className="space-y-4">
            <Field label="Championship name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="The Page Family Championship"
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Year">
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="input"
                />
              </Field>
              <Field label="Number of races">
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={numberOfRaces}
                  onChange={(e) => setNumberOfRaces(Math.max(1, Number(e.target.value)))}
                  className="input"
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-base mb-1">Drivers</h2>
          <p className="text-xs text-track-400 mb-4">Select from the roster, or add someone new.</p>

          {drivers.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {drivers.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => toggleDriver(d.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 border text-left transition-colors ${
                    selected.has(d.id) ? "border-heat bg-heat/10" : "border-track-600 hover:border-track-400"
                  }`}
                >
                  <DriverAvatar name={d.name} carColour={d.carColour} avatarUrl={d.avatarUrl} size={26} />
                  <span className="text-sm text-white truncate">{d.nickname || d.name}</span>
                </button>
              ))}
            </div>
          )}

          {newDrivers.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {newDrivers.map((d, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-2 border border-volt/40 bg-volt/5">
                  <DriverAvatar name={d.name} carColour={d.carColour} avatarUrl={null} size={26} />
                  <span className="text-sm text-white flex-1">{d.name} · {d.carColour}</span>
                  <button type="button" onClick={() => removeNewDriver(i)} className="text-xs text-track-400 hover:text-signal-red">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end border-t border-track-700 pt-4">
            <Field label="New driver name" className="flex-1">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Driver name"
                className="input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDraftDriver();
                  }
                }}
              />
            </Field>
            <Field label="Car colour">
              <select value={draftColour} onChange={(e) => setDraftColour(e.target.value)} className="input">
                {CAR_COLOURS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="button" variant="secondary" onClick={addDraftDriver}>
              Add
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base mb-1">Race calendar</h2>
          <p className="text-xs text-track-400 mb-4">Track names are free text — leave blank and fill them in later if you're not sure yet.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {tracks.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="hud-tick w-16 shrink-0">ROUND {String(i + 1).padStart(2, "0")}</span>
                <input
                  value={t}
                  onChange={(e) =>
                    setTracks((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                  }
                  placeholder="Track name"
                  className="input"
                />
              </div>
            ))}
          </div>
        </Card>

        {error && <p className="text-sm text-signal-red">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create championship"}
          </Button>
          <span className="text-xs text-track-400">{totalDriverCount} driver{totalDriverCount === 1 ? "" : "s"} selected</span>
        </div>
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          background: #10141c;
          border: 1px solid #2b3344;
          padding: 0.55rem 0.75rem;
          color: white;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #ff5a1f;
        }
      `}</style>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="hud-tick block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
