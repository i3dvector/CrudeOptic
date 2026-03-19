"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0A0A0A", color: "white", fontFamily: "sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 500, padding: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
              Something went wrong
            </h2>
            <p style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 8 }}>
              {error.message || "An unexpected error occurred."}
            </p>
            {error.digest && (
              <p style={{ color: "#6B7280", fontSize: 12, fontFamily: "monospace", marginBottom: 16 }}>
                {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                background: "#F59E0B",
                color: "black",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
