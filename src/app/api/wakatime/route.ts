export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mock() {
  return {
    demo: true,
    total: "21 hrs 47 mins",
    daily: "3 hrs 6 mins",
    languages: [
      { name: "Python", percent: 46 },
      { name: "TypeScript", percent: 28 },
      { name: "SQL", percent: 14 },
      { name: "Jupyter", percent: 8 },
      { name: "Other", percent: 4 },
    ],
  };
}

export async function GET() {
  const key = process.env.WAKATIME_API_KEY;
  if (!key) return Response.json(mock());

  try {
    const auth = "Basic " + Buffer.from(key).toString("base64");
    const res = await fetch(
      "https://wakatime.com/api/v1/users/current/stats/last_7_days",
      { headers: { Authorization: auth } }
    );
    const data = await res.json();
    const d = data?.data;
    if (!d) return Response.json(mock());

    return Response.json({
      demo: false,
      total: d.human_readable_total,
      daily: d.human_readable_daily_average,
      languages: (d.languages ?? [])
        .slice(0, 5)
        .map((l: { name: string; percent: number }) => ({
          name: l.name,
          percent: Math.round(l.percent),
        })),
    });
  } catch (err) {
    console.error("[wakatime] error:", err);
    return Response.json(mock());
  }
}
