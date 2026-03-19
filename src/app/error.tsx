"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CrudeOptic Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-crude-bg">
      <div className="glass-card p-8 max-w-lg text-center">
        <h2 className="font-heading text-xl font-bold text-white mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-400 text-sm mb-2">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="text-gray-600 text-xs font-mono mb-4">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-6 py-2 rounded-xl bg-crude-amber text-black font-heading font-bold hover:bg-crude-orange transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
