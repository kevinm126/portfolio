"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

/** Lightweight view counter. Hits /api/views (mock-backed until you wire a store). */
export function PageViews() {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/views", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && typeof d.views === "number") setViews(d.views);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (views === null) return null;
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-fg">
      <Eye size={13} className="text-icon" /> {views.toLocaleString()}
    </span>
  );
}
