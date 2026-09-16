import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
      <div>
        <div className="hud-tick mb-2">ERROR 404</div>
        <h1 className="text-3xl mb-3">Off the track</h1>
        <p className="text-sm text-track-400 mb-6 max-w-sm mx-auto">
          Whatever you were looking for isn&apos;t here — it may have been moved, or the link might be wrong.
        </p>
        <Button href="/dashboard">Back to dashboard</Button>
      </div>
    </div>
  );
}
