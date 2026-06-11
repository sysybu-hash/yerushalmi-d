"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Heebo, Arial, sans-serif",
          background: "#FAF8F4",
          color: "#1A1714",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 500 }}>
          אירעה תקלה כללית
        </h1>
        <p style={{ marginTop: "0.75rem", color: "#5c574f", maxWidth: "28rem" }}>
          מצטערים על אי הנוחות. נסו לרענן את העמוד.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1.5rem",
            background: "#1A1714",
            color: "#FAF8F4",
            border: "none",
            cursor: "pointer",
            fontSize: "0.8rem",
            letterSpacing: "0.1em",
          }}
        >
          נסו שוב
        </button>
      </body>
    </html>
  );
}
