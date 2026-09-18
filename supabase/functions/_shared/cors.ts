const DEFAULT_ALLOWED_ORIGINS = [
  "https://labs-sistema.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

const VERCEL_PREVIEW_PREFIXES = ["labs-sistema", "lab-plan-pro"];

function configuredOrigins() {
  const extra = Deno.env.get("ALLOWED_ORIGINS")
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...(extra ?? []), ...DEFAULT_ALLOWED_ORIGINS]);
}

function isAllowedVercelPreview(origin: string) {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app")) return false;

    return VERCEL_PREVIEW_PREFIXES.some(
      (prefix) =>
        url.hostname === `${prefix}.vercel.app` ||
        url.hostname.startsWith(`${prefix}-`),
    );
  } catch {
    return false;
  }
}

export function isOriginAllowed(origin: string | null) {
  if (!origin) return true;
  return configuredOrigins().has(origin) || isAllowedVercelPreview(origin);
}

export function corsHeadersForRequest(req: Request) {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-idempotency-key, x-retry-count, x-region, traceparent, tracestate, baggage",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };

  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export function handleCorsPreflight(req: Request) {
  const origin = req.headers.get("Origin");

  if (!isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: "Origem não autorizada." }), {
      status: 403,
      headers: { "Content-Type": "application/json", Vary: "Origin" },
    });
  }

  return new Response("ok", {
    headers: corsHeadersForRequest(req),
  });
}
