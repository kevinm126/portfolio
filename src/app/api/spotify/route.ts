export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Track = {
  name: string;
  artists?: { name: string }[];
  album?: { name?: string; images?: { url: string }[] };
  external_urls?: { spotify?: string };
};

function mock() {
  return {
    demo: true,
    isPlaying: true,
    title: "Weightless",
    artist: "Marconi Union",
    album: "Ambient Works",
    albumArt: null as string | null,
    url: "https://open.spotify.com",
  };
}

function fmt(item: Track, isPlaying: boolean) {
  return {
    demo: false,
    isPlaying,
    title: item.name,
    artist: (item.artists ?? []).map((a) => a.name).join(", "),
    album: item.album?.name ?? "",
    albumArt: item.album?.images?.[0]?.url ?? null,
    url: item.external_urls?.spotify ?? "https://open.spotify.com",
  };
}

export async function GET() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return Response.json(mock());

  try {
    const tokRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh,
      }),
    });
    const tok = await tokRes.json();
    const access = tok.access_token as string | undefined;
    if (!access) return Response.json(mock());

    const npRes = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      { headers: { Authorization: `Bearer ${access}` } }
    );

    if (npRes.status === 200) {
      const data = await npRes.json();
      if (data?.item) return Response.json(fmt(data.item, Boolean(data.is_playing)));
    }

    // Nothing playing — show the most recent track instead.
    const recRes = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=1",
      { headers: { Authorization: `Bearer ${access}` } }
    );
    const rec = await recRes.json();
    const item = rec?.items?.[0]?.track as Track | undefined;
    if (item) return Response.json(fmt(item, false));

    return Response.json(mock());
  } catch (err) {
    console.error("[spotify] error:", err);
    return Response.json(mock());
  }
}
