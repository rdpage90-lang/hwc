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
}

export function ResultEntryForm({
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

      if (data.championshipCompleted) {
        router.push(`/championships/${championshipId}/champion`);
      } else {
        router.push(`/championships/${championshipId}/races/${raceId}`);
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
        <p className="hud-tick mb-2">Drag drivers into finishing order</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <div className="hud-card divide-y divide-track-800">
              {order.map((driver, i) => (
                <SortableRow key={driver.id} driver={driver} position={i + 1} onDnf={() => moveTo(driver, "dnf")} onDns={() => moveTo(driver, "dns")} />
              ))}
              {order.length === 0 && <div className="p-6 text-center text-sm text-track-500">No finishers yet.</div>}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {(dnf.length > 0 || true) && (
        <div>
          <p className="hud-tick mb-2 text-signal-red">DNF</p>
          <div className="hud-card divide-y divide-track-800 min-h-[52px]">
            {dnf.map((driver) => (
              <BucketRow key={driver.id} driver={driver} onRestore={() => moveTo(driver, "order")} />
            ))}
            {dnf.length === 0 && <div className="p-4 text-center text-xs text-track-600">Drivers marked DNF appear here</div>}
          </div>
        </div>
      )}

      <div>
        <p className="hud-tick mb-2 text-track-400">DNS</p>
        <div className="hud-card divide-y divide-track-800 min-h-[52px]">
          {dns.map((driver) => (
            <BucketRow key={driver.id} driver={driver} onRestore={() => moveTo(driver, "order")} />
          ))}
          {dns.length === 0 && <div className="p-4 text-center text-xs text-track-600">Drivers marked DNS appear here</div>}
        </div>
      </div>

      {error && <p className="text-sm text-signal-red">{error}</p>}

      {!confirming ? (
        <Button onClick={() => setConfirming(true)} disabled={submitting}>
          Submit race results
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

function SortableRow({
  driver,
  position,
  onDnf,
  onDns,
}: {
  driver: Driver;
  position: number;
  onDnf: () => void;
  onDns: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: driver.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 px-3 py-2.5 bg-track-900 touch-none">
      <button {...attributes} {...listeners} className="text-track-500 cursor-grab active:cursor-grabbing px-1" aria-label="Drag to reorder">
        <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
          <circle cx="3" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
          <circle cx="3" cy="10" r="1.5" /><circle cx="11" cy="10" r="1.5" />
          <circle cx="3" cy="17" r="1.5" /><circle cx="11" cy="17" r="1.5" />
        </svg>
      </button>
      <span className="w-6 stat-figure text-track-400 text-sm">{position}</span>
      <DriverAvatar name={driver.name} carColour={driver.carColour} avatarUrl={driver.avatarUrl} size={28} />
      <span className="flex-1 text-white text-sm">{driver.nickname || driver.name}</span>
      <button type="button" onClick={onDnf} className="text-[11px] font-mono uppercase tracking-wideish text-track-500 hover:text-signal-red px-2 py-1">
        DNF
      </button>
      <button type="button" onClick={onDns} className="text-[11px] font-mono uppercase tracking-wideish text-track-500 hover:text-track-300 px-2 py-1">
        DNS
      </button>
    </div>
  );
}

function BucketRow({ driver, onRestore }: { driver: Driver; onRestore: () => void }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <DriverAvatar name={driver.name} carColour={driver.carColour} avatarUrl={driver.avatarUrl} size={26} />
      <span className="flex-1 text-white text-sm">{driver.nickname || driver.name}</span>
      <button type="button" onClick={onRestore} className="text-[11px] font-mono uppercase tracking-wideish text-track-500 hover:text-volt px-2 py-1">
        Restore
      </button>
    </div>
  );
}
