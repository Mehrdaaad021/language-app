"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "Vazirmatn, sans-serif",
            background: "#f6eede",
            color: "#40222c",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Something went wrong</h2>
          <button
            onClick={reset}
            style={{
              background: "#4a2430",
              color: "#f6eede",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}