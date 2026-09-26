export const dynamic = "force-static";

// Authorised digital sellers. Filled automatically once NEXT_PUBLIC_ADSENSE_CLIENT is set.
export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
  const pub = client.replace(/^ca-/, "");
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "# ads.txt — no advertising partners configured yet\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
