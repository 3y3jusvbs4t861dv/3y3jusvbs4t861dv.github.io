
const KEY = "site_data";
const MAX_BYTES = 64 * 1024;

const jsonResponse = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname !== "/api/data") {
      if (pathname.startsWith("/api/")) {
        return jsonResponse(
          { error: "API route not found" }, 404
        );
      }
      return env.ASSETS.fetch(request);
    }

    if (request.method === "GET") {
      const value = await env.MY_KV.get(KEY, "json");
      return jsonResponse(value ?? {});
    }

    if (request.method === "POST") {
      const suppliedToken =
        request.headers.get("Authorization");

      if (
        !env.API_WRITE_TOKEN ||
        suppliedToken !== `Bearer ${env.API_WRITE_TOKEN}`
      ) {
        return jsonResponse(
          { error: "Unauthorized" }, 401
        );
      }

      if (
        !(request.headers.get("Content-Type") || "")
          .toLowerCase().includes("application/json")
      ) {
        return jsonResponse(
          { error: "Content-Type must be application/json" },
          415
        );
      }

      const raw = await request.text();

      if (new TextEncoder().encode(raw).length > MAX_BYTES) {
        return jsonResponse(
          { error: "Data too large" }, 413
        );
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return jsonResponse(
          { error: "Invalid JSON" }, 400
        );
      }

      if (parsed === null || typeof parsed !== "object") {
        return jsonResponse(
          { error: "Expected JSON object or array" }, 400
        );
      }

      await env.MY_KV.put(KEY, raw);
      return jsonResponse({ ok: true });
    }

    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, POST" }
    });
  }
};
