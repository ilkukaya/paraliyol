import { permanentRedirect, redirect } from "next/navigation";
import { getLocation } from "@/lib/engine";
import { routeSlug } from "@/lib/engine/slugs";

// Legacy URL (/sonuc?from=...&to=...&class=...) kept for old links and bookmarks.
export default async function LegacyResult({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const from = getLocation(q.from ?? "");
  const to = getLocation(q.to ?? "");
  if (!from || !to || from.id === to.id) redirect("/");
  const cls = q.class === "moto" ? "6" : q.class;
  permanentRedirect(`/${routeSlug(from.id, to.id)}${cls && cls !== "1" ? `?arac=${cls}` : ""}`);
}
