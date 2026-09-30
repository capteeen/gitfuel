import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { test } from "node:test";

async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

test("Vercel without a registry serves public pages and blocks launch writes", async () => {
  const port = await freePort();
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VERCEL: "1",
      TURSO_DATABASE_URL: "",
      TURSO_AUTH_TOKEN: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    },
    stdio: "ignore",
  });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) break;
      try {
        const response = await fetch(`${base}/api/gful/policy`);
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, "Next server did not start");

    const [home, markets, launch, blocked] = await Promise.all([
      fetch(base),
      fetch(`${base}/api/markets`),
      fetch(`${base}/launch`),
      fetch(`${base}/api/markets`, { method: "POST" }),
    ]);
    assert.equal(home.status, 200);
    assert.equal(markets.status, 200);
    assert.deepEqual((await markets.json()).markets, []);
    assert.equal(launch.status, 200);
    assert.match(await launch.text(), /Launches are temporarily unavailable/);
    assert.equal(blocked.status, 503);
  } finally {
    child.kill("SIGTERM");
  }
});
