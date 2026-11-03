"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

const INPUT_CLASS = "w-full bg-track-850 border border-track-600 px-3 py-2 text-white text-sm";

// Renders a fragment on purpose: the toggle button sits in the user's row,
// and the open panel is `w-full` so a flex-wrap parent drops it onto its own
// line underneath. The parent row must be `flex flex-wrap`.
export function ResetUserPassword({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

const INPUT_CLASS = "w-full bg-track-850 border border-track-600 px-3 py-2 text-white text-sm";

// Renders a fragment on purpose: the toggle button sits in the user's row,
// and the open panel is `w-full` so a flex-wrap parent drops it onto its own
// line underneath. The parent row must be `flex flex-wrap`.
export function ResetUserPassword({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function toggle() {
    if (open) {
      setOpen(false);
      setPassword("");
      setConfirmPassword("");
      setError(null);
      setDone(false);
    } else {
      setOpen(true);
    }
  }

  async function save() {
    setError(null);
    if (password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/reset-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't reset that password.");
      setDone(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset that password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={toggle}>
        {open ? (done ? "Close" : "Cancel") : "Reset password"}
      </Button>

      {open && (
        <div className="w-full space-y-3 pt-1">
          {done ? (
            <p className="text-sm text-white">
              Password updated for {userName}. Pass the new password on to them — it isn&apos;t shown again.
            </p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="hud-tick block mb-1.5">New password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className="block">
                  <span className="hud-tick block mb-1.5">Confirm new password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </label>
              </div>
              {error && <p className="text-sm text-signal-red">{error}</p>}
              <Button size="sm" onClick={save} disabled={saving || !password || !confirmPassword}>
                {saving ? "Saving…" : `Set password for ${userName}`}
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function toggle() {
    if (open) {
      setOpen(false);
      setPassword("");
      setConfirmPassword("");
      setError(null);
      setDone(false);
    } else {
      setOpen(true);
    }
  }

  async function save() {
    setError(null);
    if (password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/reset-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't reset that password.");
      setDone(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset that password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={toggle}>
        {open ? (done ? "Close" : "Cancel") : "Reset password"}
      </Button>

      {open && (
        <div className="w-full space-y-3 pt-1">
          {done ? (
            <p className="text-sm text-white">
              Password updated for {userName}. Pass the new password on to them — it isn&apos;t shown again.
            </p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="hud-tick block mb-1.5">New password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className="block">
                  <span className="hud-tick block mb-1.5">Confirm new password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </label>
              </div>
              {error && <p className="text-sm text-signal-red">{error}</p>}
              <Button size="sm" onClick={save} disabled={saving || !password || !confirmPassword}>
                {saving ? "Saving…" : `Set password for ${userName}`}
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
