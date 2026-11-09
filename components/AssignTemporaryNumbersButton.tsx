"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

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
      <Button size="sm" onClick={run} disabled={loading}>
        {loading ? "Assigning…" : "Assign temporary numbers"}
      </Button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
