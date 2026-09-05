"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html dir="rtl" lang="fa">
      <body>
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#f8fafc", background: "#090d16", minHeight: "100vh" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>خطای سیستمی رخ داده است</h2>
          <p style={{ color: "#8493ad", marginBottom: "24px" }}>سامانه در حالت ایمن متوقف شد.</p>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              cursor: "pointer",
              background: "#3b82f6",
              color: "#ffffff",
              borderRadius: "6px",
              border: "none",
              fontWeight: 600,
            }}
          >
            تلاش مجدد
          </button>
        </div>
      </body>
    </html>
  );
}
