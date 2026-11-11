"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DriverAvatar, Button } from "@/components/ui";

interface Driver {
  id: string;
  name: string;
  nickname: string | null;
  carColour: string;
  avatarUrl: string | null;
  driverNumber: number | null;
}

const MEDALS = ["🥇", "🥈", "🥉"];

// Submits to the exact same route as the standard entry form, so scoring,
// validation and result immutability are all unchanged — this component is
// only a friendlier way to build the same payload.
export function RaceDayEntryForm({
  championshipId,
  raceId,
  drivers,
}: {
  championshipId: string;
  raceId: string;
  drivers: Driver[];
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Driver[]>(drivers);
  const [dnf, setDnf] = useState<Driver[]>([]);
  const [dns, setDns] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function nudge(index: number, direction: -1 | 1) {
    setOrder((items) => {
      const target = index + direction;
      if (target < 0 || target >= items.length) return items;
      return arrayMove(items, index, target);
    });
  }

  function moveTo(driver: Driver, bucket: "dnf" | "dns" | "order") {
    setOrder((p) => p.filter((d) => d.id !== driver.id));
    setDnf((p) => p.filter((d) => d.id !== driver.id));
    setDns((p) => p.filter((d) => d.id !== driver.id));
    if (bucket === "dnf") setDnf((p) => [...p, driver]);
    else if (bucket === "dns") setDns((p) => [...p, driver]);
    else setOrder((p) => [...p, driver]);
  }

  async function onSubmit() {
    setError(null);
    if (order.length === 0 && dnf.length === 0 && dns.length === 0) {
      setError("Add at least one result.");
      return;
    }
    setSubmitting(true);
    try {
      const results = [
        ...order.map((d, i) => ({ driverId: d.id, resultStatus: "FINISHED" as const, finishingPosition: i + 1 })),
        ...dnf.map((d) => ({ driverId: d.id, resultStatus: "DNF" as const, finishingPosition: null })),
        ...dns.map((d) => ({ driverId: d.id, resultStatus: "DNS" as const, finishingPosition: null })),
      ];

      const res = await fetch(`/api/championships/${championshipId}/races/${raceId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't submit these results.");

      // Final round goes to the existing champion page; every other round
      // lands on the Race Day celebration screen.
      if (data.championshipCompleted) {
        router.push(`/championships/${championshipId}/champion`);
      } else {
        router.push(`/race-day/${championshipId}/${raceId}/result`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit these results.");
      setSubmitting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="hud-tick mb-2">Finishing order — drag, or use the arrows</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <div className="hud-card divide-y divide-track-800">
              {order.map((driver, i) => (
                <RaceDayRow
                  key={driver.id}
                  driver={driver}
                  index={i}
                  total={order.length}
                  onUp={() => nudge(i, -1)}
                  onDown={() => nudge(i, 1)}
                  onDnf={() => moveTo(driver, "dnf")}
                  onDns={() => moveTo(driver, "dns")}
                />
              ))}
              {order.length === 0 && <div className="p-6 text-center text-sm text-track-500">No finishers yet.</div>}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div>
        <p className="hud-tick mb-2 text-signal-red">Did not finish</p>
        <div className="hud-card divide-y divide-track-800 min-h-[60px]">
          {dnf.map((driver) => (
            <BucketRow key={driver.id} driver={driver} onRestore={() => moveTo(driver, "order")} />
          ))}
          {dnf.length === 0 && <div className="p-4 text-center text-xs text-track-600">Drivers marked DNF appear here</div>}
        </div>
      </div>

      <div>
        <p className="hud-tick mb-2 text-track-400">Did not start</p>
        <div className="hud-card divide-y divide-track-800 min-h-[60px]">
          {dns.map((driver) => (
            <BucketRow key={driver.id} driver={driver} onRestore={() => moveTo(driver, "order")} />
          ))}
          {dns.length === 0 && <div className="p-4 text-center text-xs text-track-600">Drivers marked DNS appear here</div>}
        </div>
      </div>

      {error && <p className="text-sm text-signal-red">{error}</p>}

      {!confirming ? (
        <Button onClick={() => setConfirming(true)} disabled={submitting}>
          Submit results
        </Button>
      ) : (
        <div className="hud-card p-4 border-heat/40 space-y-3">
          <p className="text-sm text-white">
            Once submitted this result is locked permanently — it can&apos;t be edited, reordered, or undone. Sure this is right?
          </p>
          <div className="flex gap-3">
            <Button onClick={onSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Yes, lock it in"}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={submitting}>
              Go back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function numberLabel(driver: Driver) {
  return driver.driverNumber != null ? `#${String(driver.driverNumber).padStart(2, "0")}` : null;
}

function RaceDayRow({
  driver,
  index,
  total,
  onUp,
  onDown,
  onDnf,
  onDns,
}: {
  driver: Driver;
  index: number;
  total: number;
  onUp: () => void;
  onDown: () => void;
  onDnf: () => void;
  onDns: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: driver.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    // Car colour as a bar down the left edge — the named palette is plain CSS colour names.
    borderLeft: `4px solid ${driver.carColour.toLowerCase()}`,
  };
  const number = numberLabel(driver);

  return (
    <div ref={setNodeRef} style={style} className="bg-track-900 px-3 py-3 space-y-3">
      <div className="flex items-center gap-3">
        {/* touch-none only on the handle, so the rest of the row still scrolls the page */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="touch-none w-11 h-11 flex items-center justify-center text-track-500 cursor-grab active:cursor-grabbing shrink-0"
          aria-label={`Drag ${driver.nickname || driver.name} to reorder`}
        >
          <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="3" cy="10" r="1.5" />
            <circle cx="11" cy="10" r="1.5" />
            <circle cx="3" cy="17" r="1.5" />
            <circle cx="11" cy="17" r="1.5" />
          </svg>
        </button>
        <span className="w-8 text-center stat-figure text-xl text-track-300 shrink-0">{index < 3 ? MEDALS[index] : index + 1}</span>
        <DriverAvatar name={driver.name} carColour={driver.carColour} avatarUrl={driver.avatarUrl} size={36} />
        <div className="flex-1 min-w-0">
          <div className="text-white text-base truncate">{driver.nickname || driver.name}</div>
          {number && <div className="hud-tick">{number}</div>}
        </div>
        <button
          type="button"
          onClick={onUp}
          disabled={index === 0}
          className="w-11 h-11 flex items-center justify-center text-track-300 border border-track-600 disabled:opacity-30 shrink-0"
          aria-label="Move up"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={onDown}
          disabled={index === total - 1}
          className="w-11 h-11 flex items-center justify-center text-track-300 border border-track-600 disabled:opacity-30 shrink-0"
          aria-label="Move down"
        >
          ▼
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onDnf}
          className="h-11 text-xs font-mono uppercase tracking-wideish text-signal-red border border-track-600 hover:border-signal-red"
        >
          DNF
        </button>
        <button
          type="button"
          onClick={onDns}
          className="h-11 text-xs font-mono uppercase tracking-wideish text-track-300 border border-track-600 hover:border-track-400"
        >
          DNS
        </button>
      </div>
    </div>
  );
}

function BucketRow({ driver, onRestore }: { driver: Driver; onRestore: () => void }) {
  const number = numberLabel(driver);
  return (
    <div className="flex items-center gap-3 px-3 py-3" style={{ borderLeft: `4px solid ${driver.carColour.toLowerCase()}` }}>
      <DriverAvatar name={driver.name} carColour={driver.carColour} avatarUrl={driver.avatarUrl} size={32} />
      <div className="flex-1 min-w-0">
        <div className="text-white text-base truncate">{driver.nickname || driver.name}</div>
        {number && <div className="hud-tick">{number}</div>}
      </div>
      <button
        type="button"
        onClick={onRestore}
        className="h-11 px-4 text-xs font-mono uppercase tracking-wideish text-track-300 border border-track-600 hover:border-track-400 shrink-0"
      >
        Restore
      </button>
    </div>
  );
}
