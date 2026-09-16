"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

const CAR_COLOURS = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Black", "White", "Pink", "Cyan"];

export function NewDriverForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [carColour, setCarColour] = useState<string>(CAR_COLOURS[0] ?? "Red");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Add driver
      </Button>
    );
  }

  async function onSubmit() {
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nickname: nickname || undefined, carColour }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create that driver.");
      setOpen(false);
      setName("");
      setNickname("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that driver.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="grid sm:grid-cols-3 gap-3 mb-3">
        <label className="block sm:col-span-1">
          <span className="hud-tick block mb-1.5">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-track-850 border border-track-600 px-3 py-2 text-white text-sm" />
        </label>
        <label className="block sm:col-span-1">
          <span className="hud-tick block mb-1.5">Nickname (optional)</span>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-track-850 border border-track-600 px-3 py-2 text-white text-sm" />
        </label>
        <label className="block sm:col-span-1">
          <span className="hud-tick block mb-1.5">Car colour</span>
          <select value={carColour} onChange={(e) => setCarColour(e.target.value)} className="w-full bg-track-850 border border-track-600 px-3 py-2 text-white text-sm">
            {CAR_COLOURS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="text-sm text-signal-red mb-3">{error}</p>}
      <div className="flex gap-3">
        <Button size="sm" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Adding…" : "Add driver"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
