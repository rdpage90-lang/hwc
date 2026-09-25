"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";

export function DriverNumberEditor({
  driverId,
  driverNumber,
  isAdmin,
}: {
  driverId: string;
  driverNumber: number | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(driverNumber?.toString() ?? "");
  const [current, setCurrent] = useState(driverNumber);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `current` starts as a copy of the driverNumber prop, but useState's
  // initial value is only used on first mount — without this, a
  // server-side refresh triggered elsewhere on the page (e.g. the bulk
  // "assign temporary numbers" action) updates the prop but this
  // component keeps showing its stale local copy until a full reload.
  useEffect(() => {
    setCurrent(driverNumber);
  }, [driverNumber]);

  if (!isAdmin) {
    return current !== null ? <Badge tone="volt">#{String(current).padStart(2, "0")}</Badge> : null;
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)}>
        {current !== null ? (
          <Badge tone="volt">#{String(current).padStart(2, "0")}</Badge>
        ) : (
          <Badge tone="neutral">Set number</Badge>
        )}
      </button>
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    const parsed = value.trim() === "" ? null : Number(value);
    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverNumber: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update driver number");
      setCurrent(data.driver.driverNumber);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update driver number");
    } finally {
      setSaving(false);
    }
  }

  async function suggestNext() {
    const res = await fetch("/api/drivers/next-number");
    if (res.ok) {
      const data = await res.json();
      setValue(String(data.nextAvailable));
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        min={1}
        max={999}
        autoFocus
        className="w-14 bg-track-900 border border-track-700 rounded px-1 py-0.5 text-xs text-white"
      />
      <button type="button" onClick={suggestNext} className="text-xs text-track-400 hover:text-white" title="Suggest next available number">
        auto
      </button>
      <button type="button" onClick={save} disabled={saving} className="text-xs text-volt-400 hover:text-volt-300 disabled:opacity-50">
        {saving ? "…" : "save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setValue(current?.toString() ?? "");
          setError(null);
        }}
        className="text-xs text-track-500 hover:text-track-300"
      >
        cancel
      </button>
      {error && <span className="text-xs text-red-400 ml-1">{error}</span>}
    </div>
  );
}
