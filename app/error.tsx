"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
      <div>
        <div className="hud-tick mb-2 text-signal-red">SYSTEM FAULT</div>
        <h1 className="text-3xl mb-3">Something went wrong</h1>
        <p className="text-sm text-track-400 mb-6 max-w-sm mx-auto">
          That didn&apos;t work as expected. Nothing was lost — your data is safe either way.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset} variant="secondary">
            Try again
          </Button>
          <Button href="/dashboard">Back to dashboard</Button>
        </div>
      </div>
    </div>
  );
}
