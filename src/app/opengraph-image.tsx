import { ImageResponse } from "next/og";
import { profile } from "@/content/content";
import { techBadges } from "@/lib/github-data";

export const alt = `${profile.name} · ${profile.identities.map((i) => i.label).join(" & ")}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors the site's dark theme + README banner gradients (globals.css / ReadmeCard).
export default function Image() {
  const chips = techBadges.slice(0, 6);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          backgroundColor: "#0d1117",
          backgroundImage:
            "radial-gradient(circle at 22% 20%, #1f6feb33, transparent 55%), radial-gradient(circle at 82% 75%, #23863633, transparent 50%)",
          color: "#f0f6fc",
          fontSize: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#9198a1",
            fontSize: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "6px 16px",
              border: "1px solid #3d444d",
              borderRadius: 8,
              backgroundColor: "#151b23",
            }}
          >
            {profile.handle}/README.md
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>
            {profile.name}
          </div>
          <div style={{ display: "flex", fontSize: 36, color: "#9198a1" }}>
            {profile.identities.map((i) => i.label).join(" · ")}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 27,
              color: "#c9d1d9",
              lineHeight: 1.45,
              maxWidth: 950,
            }}
          >
            I build AI/ML tools end-to-end in Python and ship real products — from
            NHANES-trained risk models to deployed web apps.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {chips.map((t) => (
            <div
              key={t.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 18px",
                borderRadius: 8,
                border: `1px solid ${t.color}55`,
                backgroundColor: `${t.color}1f`,
                fontSize: 24,
                color: "#f0f6fc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 12,
                  height: 12,
                  borderRadius: 12,
                  backgroundColor: t.color,
                }}
              />
              {t.label}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
