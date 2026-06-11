import { store, type GuestEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ entries: store.guestbook });
}

export async function POST(req: Request) {
  let data: { name?: string; message?: string } = {};
  try {
    data = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const name = (data.name ?? "").toString().trim().slice(0, 40);
  const message = (data.message ?? "").toString().trim().slice(0, 200);
  if (!name || !message) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const entry: GuestEntry = {
    id: crypto.randomUUID(),
    name,
    message,
    createdAt: new Date().toISOString(),
  };
  store.guestbook.unshift(entry);
  // keep it from growing unbounded in dev
  store.guestbook = store.guestbook.slice(0, 100);

  return Response.json({ entry });
}
