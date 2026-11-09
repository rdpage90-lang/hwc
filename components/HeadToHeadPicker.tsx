"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

interface DriverOption {
  id: string;
  name: string;
  nickname: string | null;
  driverNumber: number | null;
}

function optionLabel(d: DriverOption) {
  const name = d.nickname || d.name;
  return d.driverNumber != null ? `${name} #${String(d.driverNumber).padStart(2, "0")}` : name;
}

export function HeadToHeadPicker({ drivers, defaultA, defaultB }: { drivers: DriverOption[]; defaultA?: string; defaultB?: string }) {
  const router = useRouter();
  const [a, setA] = useState(defaultA ?? "");
  const [b, setB] = useState(defaultB ?? "");

  function compare() {
    if (!a || !b || a === b) return;
    router.push(`/stats/head-to-head?a=${a}&b=${b}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
      <label className="block flex-1">
        <span className="hud-tick block mb-1.5">Driver A</span>
        <select value={a} onChange={(e) => setA(e.target.value)} className="input w-full">
          <option value="">Select a driver</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id} disabled={d.id === b}>
              {optionLabel(d)}
            </option>
          ))}
        </select>
      </label>
      <label className="block flex-1">
        <span className="hud-tick block mb-1.5">Driver B</span>
        <select value={b} onChange={(e) => setB(e.target.value)} className="input w-full">
          <option value="">Select a driver</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id} disabled={d.id === a}>
              {optionLabel(d)}
            </option>
          ))}
        </select>
      </label>
      <Button size="sm" onClick={compare} disabled={!a || !b || a === b}>
        Compare
      </Button>
    </div>
  );
}
