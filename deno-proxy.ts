export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("target");
    if (!target) {
      return new Response("missing target param", { status: 400 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    const skip = new Set([
      "host",
      "content-length",
      "connection",
      "keep-alive",
      "transfer-encoding",
      "upgrade",
    ]);
    const headers = {};
    for (const [k, v] of request.headers) {
      if (!skip.has(k.toLowerCase())) headers[k] = v;
    }

    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.arrayBuffer()
        : undefined;

    const resp = await fetch(target, {
      method: request.method,
      headers,
      body,
    });

    const out = new Headers(resp.headers);
    out.set("Access-Control-Allow-Origin", "*");
    out.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    out.set("Access-Control-Allow-Headers", "*");

    return new Response(resp.body, { status: resp.status, headers: out });
  },
};
