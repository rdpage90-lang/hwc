"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

export function NewUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "PLAYER">("PLAYER");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + New user
      </Button>
    );
  }

  async function onSubmit() {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create that user.");
      setSuccess(`${data.user.name} can now sign in with the password you set.`);
      setName("");
      setEmail("");
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="space-y-3 mb-3">
        <label className="block">
          <span className="hud-tick block mb-1.5">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-track-850 border border-track-600 px-3 py-2 text-white text-sm" />
        </label>
        <label className="block">
          <span className="hud-tick block mb-1.5">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-track-850 border border-track-600 px-3 py-2 text-white text-sm" />
        </label>
        <label className="block">
          <span className="hud-tick block mb-1.5">Temporary password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-track-850 border border-track-600 px-3 py-2 text-white text-sm" />
        </label>
        <label className="block">
          <span className="hud-tick block mb-1.5">Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "PLAYER")} className="w-full bg-track-850 border border-track-600 px-3 py-2 text-white text-sm">
            <option value="PLAYER">Player (read-only)</option>
            <option value="ADMIN">Admin (full control)</option>
          </select>
        </label>
      </div>
      {error && <p className="text-sm text-signal-red mb-3">{error}</p>}
      {success && <p className="text-sm text-volt-bright mb-3">{success}</p>}
      <div className="flex gap-3">
        <Button size="sm" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Creating…" : "Create user"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </Card>
  );
}
