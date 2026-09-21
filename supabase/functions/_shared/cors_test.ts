import {
  corsHeadersForRequest,
  handleCorsPreflight,
  isOriginAllowed,
} from "./cors.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} Expected: ${String(expected)}. Received: ${String(actual)}.`);
  }
}

function allowedHeaders(response: Response) {
  return (response.headers.get("Access-Control-Allow-Headers") ?? "")
    .split(",")
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean);
}

async function withoutConfiguredOrigins<T>(run: () => T | Promise<T>): Promise<T> {
  const previous = Deno.env.get("ALLOWED_ORIGINS");

  try {
    Deno.env.delete("ALLOWED_ORIGINS");
    return await run();
  } finally {
    if (previous === undefined) Deno.env.delete("ALLOWED_ORIGINS");
    else Deno.env.set("ALLOWED_ORIGINS", previous);
  }
}

Deno.test("CORS accepts the local development origins currently used by the project", async () => {
  await withoutConfiguredOrigins(() => {
    const origins = [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://192.168.56.1:8080",
      "http://10.235.226.58:8080",
    ];

    for (const origin of origins) {
      assert(isOriginAllowed(origin), `Expected local origin to be allowed: ${origin}`);
    }
  });
});

Deno.test("CORS rejects unknown origins instead of accepting broad Vercel or private-network patterns", async () => {
  await withoutConfiguredOrigins(() => {
    const blockedOrigins = [
      "https://evil.example.com",
      "https://random-preview.vercel.app",
      "http://192.168.1.10:8080",
    ];

    for (const origin of blockedOrigins) {
      assert(!isOriginAllowed(origin), `Expected origin to be blocked: ${origin}`);

      const headers = corsHeadersForRequest(
        new Request("https://example.test", { headers: { Origin: origin } }),
      );
      assert(
        !("Access-Control-Allow-Origin" in headers),
        `Blocked origin must not receive Access-Control-Allow-Origin: ${origin}`,
      );
    }
  });
});

Deno.test("requests without Origin remain available to non-browser callers", async () => {
  await withoutConfiguredOrigins(() => {
    assert(isOriginAllowed(null), "Requests without Origin should be accepted.");

    const headers = corsHeadersForRequest(new Request("https://example.test"));
    assert(
      !("Access-Control-Allow-Origin" in headers),
      "A non-browser request must not receive a fabricated Access-Control-Allow-Origin header.",
    );
  });
});

Deno.test("allowed preflight returns all headers required by current project clients", async () => {
  await withoutConfiguredOrigins(async () => {
    const origin = "http://localhost:8080";
    const response = handleCorsPreflight(
      new Request("https://example.test", {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers":
            "authorization, x-client-info, apikey, content-type, x-idempotency-key, x-retry-count, x-region, traceparent, tracestate, baggage",
        },
      }),
    );

    assertEquals(response.status, 200, "Allowed preflight should succeed.");
    assertEquals(
      response.headers.get("Access-Control-Allow-Origin"),
      origin,
      "Allowed preflight must reflect the request origin.",
    );
    assertEquals(
      response.headers.get("Access-Control-Allow-Methods"),
      "POST, OPTIONS",
      "Only the methods used by the administrative functions should be advertised.",
    );
    assertEquals(response.headers.get("Vary"), "Origin", "Preflight must vary by Origin.");
    assertEquals(await response.text(), "ok", "Successful preflight should return the expected body.");

    const headers = allowedHeaders(response);
    const requiredHeaders = [
      "authorization",
      "x-client-info",
      "apikey",
      "content-type",
      "x-idempotency-key",
      "x-retry-count",
      "x-region",
      "traceparent",
      "tracestate",
      "baggage",
    ];

    for (const header of requiredHeaders) {
      assert(headers.includes(header), `Missing required CORS header: ${header}`);
    }
  });
});

Deno.test("blocked preflight returns 403 without exposing an allowed origin", async () => {
  await withoutConfiguredOrigins(async () => {
    const response = handleCorsPreflight(
      new Request("https://example.test", {
        method: "OPTIONS",
        headers: { Origin: "https://untrusted.example.com" },
      }),
    );

    assertEquals(response.status, 403, "Blocked preflight should return 403.");
    assertEquals(response.headers.get("Vary"), "Origin", "Blocked preflight must vary by Origin.");
    assert(
      response.headers.get("Access-Control-Allow-Origin") === null,
      "Blocked preflight must not expose Access-Control-Allow-Origin.",
    );

    const body = await response.json();
    assertEquals(body.error, "Origem não autorizada.", "Blocked preflight should explain the rejection.");
  });
});

Deno.test("ALLOWED_ORIGINS adds exact trusted origins without widening the default policy", () => {
  const previous = Deno.env.get("ALLOWED_ORIGINS");
  const configured = "https://preview.example.com, https://admin.example.com ";

  try {
    Deno.env.set("ALLOWED_ORIGINS", configured);

    assert(isOriginAllowed("https://preview.example.com"), "Configured preview origin should be allowed.");
    assert(isOriginAllowed("https://admin.example.com"), "Configured admin origin should be allowed.");
    assert(
      !isOriginAllowed("https://sub.preview.example.com"),
      "Configured origins must remain exact matches.",
    );
    assert(
      !isOriginAllowed("https://random-production.example.com"),
      "Unconfigured production origins must remain blocked.",
    );
  } finally {
    if (previous === undefined) Deno.env.delete("ALLOWED_ORIGINS");
    else Deno.env.set("ALLOWED_ORIGINS", previous);
  }
});
