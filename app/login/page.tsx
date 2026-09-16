"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("That email and password combination doesn't match our records.");
      return;
    }
    router.push(params.get("callbackUrl") || "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-fade pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-10">
          <div className="font-display font-bold text-4xl text-white tracking-tightish">HWC</div>
          <div className="hud-tick mt-2">HEAT WORLD CHAMPIONSHIP</div>
        </div>

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
              className="w-full bg-track-850 border border-track-600 px-3 py-2.5 text-white placeholder:text-track-500 focus:border-heat outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="hud-tick block mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-track-850 border border-track-600 px-3 py-2.5 text-white placeholder:text-track-500 focus:border-heat outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-signal-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-heat text-track-950 font-display font-bold uppercase tracking-wideish py-3 hover:bg-heat-bright transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>

        <p className="text-center text-xs text-track-500 mt-6">
          Ask your championship admin if you need an account.
        </p>
      </div>
    </div>
  );
}
