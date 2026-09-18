"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssignTemporaryNumbersButton({ unassignedCount }: { unassignedCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (unassignedCount === 0) return null;

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/drivers/assign-temporary-numbers", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to assign numbers");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign numbers");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hud-card p-4 flex items-center justify-between gap-3">
      <div>
        <div className="text-sm text-white">
          {unassignedCount} driver{unassignedCount === 1 ? "" : "s"} without a number
        </div>
        <div className="text-xs text-track-400 mt-0.5">
          Assign temporary numbers now — edit any of them individually afterward.
        </div>
      </div>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded bg-volt-500 text-track-950 hover:bg-volt-400 disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? "Assigning…" : "Assign temporary numbers"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
