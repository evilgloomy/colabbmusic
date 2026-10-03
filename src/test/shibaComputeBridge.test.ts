// @vitest-environment node
import { expect, it, vi } from "vitest";
import { shibaComputeSessionHandler } from "../../supabase/functions/_shared/shibaComputeSession";
const id = "ea0ca7ce-7103-4924-b46a-2cc5a5686965";
const request = () => new Request("https://edge.example", { method: "POST", headers: { Authorization: "Bearer user-token" }, body: JSON.stringify({ live_session_id: id }) });
it("bridge checks exact live session access before using its server key", async () => {
  const authorize = vi.fn(async () => false), fetcher = vi.fn();
  const handler = shibaComputeSessionHandler({ authorize, fetcher, apiUrl: "https://compute.example", apiKey: "master-secret", cors: {} });
  expect((await handler(request())).status).toBe(403);
  expect(authorize).toHaveBeenCalledWith("user-token", id);
  expect(fetcher).not.toHaveBeenCalled();
});
it("bridge returns only scoped grant fields and never master/worker credentials", async () => {
  const fetcher = vi.fn(async (_url, init) => {
    expect(init.headers.Authorization).toBe("Bearer master-secret");
    expect(JSON.parse(init.body).character_id).toBe("cola_b");
    return new Response(JSON.stringify({ session_id: id, session_token: "scoped", expires_at: new Date(Date.now() + 100000).toISOString(),
      signaling_url: "https://compute.example/v1/compute/sessions/" + id, worker: { ip: "10.0.0.1", token: "worker-secret" }, api_key: "master-secret" }));
  });
  const handler = shibaComputeSessionHandler({ authorize: async () => true, fetcher, apiUrl: "https://compute.example", apiKey: "master-secret", cors: {} });
  const response = await handler(request()), body = await response.json();
  expect(response.status).toBe(200);
  expect(Object.keys(body).sort()).toEqual(["expires_at", "session_id", "session_token", "signaling_url"]);
  expect(JSON.stringify(body)).not.toContain("master-secret");
});
it("missing configuration / upstream failure preserve a safe fallback response", async () => {
  for (const deps of [{}, { apiUrl: "https://compute.example", apiKey: "secret", fetcher: vi.fn(async () => new Response("private provider detail", { status: 503 })) }]) {
    const response = await shibaComputeSessionHandler({ ...deps, authorize: async () => true, cors: {} })(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private provider detail");
  }
});
