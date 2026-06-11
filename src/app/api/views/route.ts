import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ views: store.views });
}

export async function POST() {
  store.views += 1;
  return Response.json({ views: store.views });
}
