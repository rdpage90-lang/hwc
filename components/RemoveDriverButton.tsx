"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveDriverButton({ championshipId, driverId }: { championshipId: string; driverId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onRemove() {
    setBusy(true);
    const res = await fetch(`/api/championships/${championshipId}/drivers/${driverId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setConfirming(true);
        }}
        className="text-[11px] font-mono uppercase tracking-wideish text-track-500 hover:text-signal-red"
      >
        Remove
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wideish">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onRemove();
        }}
        disabled={busy}
        className="text-signal-red"
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setConfirming(false);
        }}
        className="text-track-500"
      >
        Cancel
      </button>
    </span>
  );
}
