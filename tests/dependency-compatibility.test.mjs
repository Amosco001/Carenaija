import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import express from "express";
import csrf from "csurf";
import { Storage } from "@google-cloud/storage";
import puppeteer from "puppeteer-core";

const require = createRequire(import.meta.url);

test("Google storage and browser automation retain their used APIs", () => {
  assert.equal(typeof Storage, "function");
  assert.equal(typeof Storage.prototype.bucket, "function");
  assert.equal(typeof puppeteer.launch, "function");
});

test("the Google HTTP client's patched UUID dependency supports CommonJS", () => {
  const googleRequire = createRequire(require.resolve("gaxios"));
  const { v4, validate } = googleRequire("uuid");
  assert.equal(validate(v4()), true);
});

test("the database tooling loader compiles TypeScript with patched esbuild", async () => {
  const { transform, transformSync } = require("@esbuild-kit/core-utils");
  const source = "const amount: number = 42; export { amount };";
  for (const result of [
    transformSync(source, "/tmp/dependency-test.ts", { format: "cjs" }),
    await transform(source, "/tmp/dependency-test.ts", { format: "cjs" }),
  ]) {
    const output = { exports: {} };
    new Function("module", result.code)(output);
    assert.equal(output.exports.amount, 42);
  }
});

test("CSRF cookie parsing and invalid-token rejection still work", async (t) => {
  const csrfRequire = createRequire(require.resolve("csurf"));
  const cookie = csrfRequire("cookie");
  const app = express();
  app.use((req, _res, next) => {
    req.cookies = cookie.parse(req.headers.cookie || "");
    next();
  });
  const protection = csrf({ cookie: { httpOnly: true, sameSite: "lax" } });
  app.get("/token", protection, (req, res) => res.json({ token: req.csrfToken() }));
  app.post("/submit", protection, (_req, res) => res.sendStatus(204));
  app.use((error, _req, res, _next) => res.sendStatus(error.code === "EBADCSRFTOKEN" ? 403 : 500));
  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    listener.on("error", reject);
  });
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const tokenResponse = await fetch(`${origin}/token`);
  const { token } = await tokenResponse.json();
  const sessionCookie = tokenResponse.headers.get("set-cookie").split(";")[0];
  assert.ok(sessionCookie.startsWith("_csrf="));
  assert.equal((await fetch(`${origin}/submit`, {
    method: "POST", headers: { Cookie: sessionCookie, "X-CSRF-Token": token },
  })).status, 204);
  assert.equal((await fetch(`${origin}/submit`, {
    method: "POST", headers: { Cookie: sessionCookie, "X-CSRF-Token": "invalid" },
  })).status, 403);
});

test("mockup discovery includes nested previews but excludes private and hidden files", async (t) => {
  const sandboxRequire = createRequire(new URL("../artifacts/mockup-sandbox/package.json", import.meta.url));
  const { glob } = sandboxRequire("glob");
  const root = await mkdtemp(path.join(tmpdir(), "carenaija-mockup-glob-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const base = "src/components/mockups";
  const files = ["Alpha.tsx", "group/Beta.tsx", "_helper.tsx", "_private/Hidden.tsx", ".hidden.tsx"];
  for (const file of files) {
    const destination = path.join(root, base, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, "export default function Mockup() { return null; }");
  }
  assert.deepEqual((await glob(`${base}/**/*.tsx`, {
    cwd: root, ignore: ["**/_*/**", "**/_*.tsx"], nodir: true,
  })).sort(), [`${base}/Alpha.tsx`, `${base}/group/Beta.tsx`]);
});