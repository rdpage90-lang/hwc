"use client";

import { useState } from "react";
import Link from "next/link";

const INPUT_CLASS =
  "w-full bg-track-850 border border-track-600 px-3 py-2.5 text-white placeholder:text-track-500 focus:border-heat outline-none";

export function ResetPasswordForm({ enabled }: { enabled: boolean }) {
  const [email, setEmail] = useState("");
  const [resetKey, setResetKey] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetKey, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't reset the password.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset the password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-fade pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-10">
          <div className="font-display font-bold text-4xl text-white tracking-tightish">HWC</div>
          <div className="hud-tick mt-2">RESET PASSWORD</div>
        </div>

        {!enabled ? (
          <div className="hud-card p-6 space-y-3">
            <p className="text-sm text-white">Password reset isn&apos;t enabled on this site.</p>
            <p className="text-xs text-track-400">Ask your championship admin to reset your password.</p>
          </div>
        ) : done ? (
          <div className="hud-card p-6 space-y-4">
            <p className="text-sm text-white">Password updated. You can log in with the new one now.</p>
            <Link
              href="/login"
              className="block w-full text-center bg-heat text-track-950 font-display font-bold uppercase tracking-wideish py-3 hover:bg-heat-bright transition-colors"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="hud-card p-6 space-y-5">
            <div>
              <label className="hud-tick block mb-1.5" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="hud-tick block mb-1.5" htmlFor="resetKey">
                Reset key
              </label>
              <input
                id="resetKey"
                type="password"
                required
                autoComplete="off"
                value={resetKey}
                onChange={(e) => setResetKey(e.target.value)}
                className={INPUT_CLASS}
                placeholder="The key set in Vercel"
              />
            </div>
            <div>
              <label className="hud-tick block mb-1.5" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLASS}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="hud-tick block mb-1.5" htmlFor="confirmPassword">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={INPUT_CLASS}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-signal-red">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-heat text-track-950 font-display font-bold uppercase tracking-wideish py-3 hover:bg-heat-bright transition-colors disabled:opacity-50"
            >
              {loading ? "Updating…" : "Set new password"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-track-500 mt-6">
          <Link href="/login" className="hover:text-white transition-colors">
            ← Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
