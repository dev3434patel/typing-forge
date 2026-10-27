import { expect, test, type Page } from "@playwright/test";
import { build } from "vite";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";

type Scenario = "before" | "gap" | "after" | "unmount";
interface JournalEntry {
  sequence: number;
  kind: "read" | "subscribe" | "unsubscribe" | "publish" | "layout" | "passive";
  subscribers: number;
  phase: string;
}
interface Probe {
  snapshot: { phase: string; installAvailable: boolean; message: string };
  activeSubscribers: number;
  subscribeCount: number;
  unsubscribeCount: number;
  notificationCount: number;
  passiveCommitted: boolean;
  journal: JournalEntry[];
}

const INITIAL_MESSAGE = "Fixture public download is preparing.";
const READY_MESSAGE = "Fixture public download is ready.";
const STORE_SOURCE = `
let snapshot = Object.freeze({ supported: true, phase: "preparing", offline: false,
  installed: false, installAvailable: false, updateAvailable: false,
  message: ${JSON.stringify(INITIAL_MESSAGE)} });
const listeners = new Set();
const journal = [];
let sequence = 0, subscribeCount = 0, unsubscribeCount = 0;
let notificationCount = 0, passiveCommitted = false;
function note(kind) {
  if (journal.length < 256) journal.push({ sequence: sequence++, kind,
    subscribers: listeners.size, phase: snapshot.phase });
}
export function getPwaState() { note("read"); return snapshot; }
export function subscribePwa(listener) {
  listeners.add(listener); subscribeCount++; note("subscribe");
  return () => { if (listeners.delete(listener)) { unsubscribeCount++; note("unsubscribe"); } };
}
export function publish() {
  snapshot = Object.freeze({ ...snapshot, phase: "ready", installAvailable: true,
    message: ${JSON.stringify(READY_MESSAGE)} });
  note("publish");
  for (const listener of [...listeners]) { notificationCount++; listener(); }
}
export function markLayout() { note("layout"); }
export function markPassive() { passiveCommitted = true; note("passive"); }
export function inspect() {
  return { snapshot, activeSubscribers: listeners.size, subscribeCount,
    unsubscribeCount, notificationCount, passiveCommitted,
    journal: journal.map(entry => ({ ...entry })) };
}
// The fixture owns only the consumer/store boundary. Native PWA lifecycle and
// permissions remain covered by the separate real-worker/lifecycle suites.
export const startPwa = () => () => {};
export const applyPwaUpdate = () => {};
export const installPwa = async () => {};
export const checkPwaDownload = async () => {};
export const clearPwaDownload = async () => {};
`;

async function startSnapshotFixture() {
  const fixtureRequire = createRequire(import.meta.url);
  const iconDirectory = path.join(path.dirname(fixtureRequire.resolve("lucide-react/package.json")), "dist/esm/icons");
  const iconSource = [["Download", "download"], ["RefreshCw", "refresh-cw"], ["WifiOff", "wifi-off"], ["X", "x"]]
    .map(([name, file]) => `export { default as ${name} } from ${JSON.stringify(path.join(iconDirectory, `${file}.js`).replaceAll("\\", "/"))};`).join("\n");
  const entry = `
import React, { useEffect, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { PwaStatus } from "./src/components/layout/PwaStatus.tsx";
import Offline from "./src/pages/Offline.tsx";
import { publish, inspect, markLayout, markPassive } from "fixture:pwa-store";
const scenario = new URL(location.href).searchParams.get("scenario");
if (scenario === "before") publish();
function PublicationBoundary() {
  useLayoutEffect(() => { markLayout(); if (scenario === "gap") publish(); }, []);
  useEffect(() => { markPassive(); }, []);
  return null;
}
const root = createRoot(document.getElementById("fixture-root"));
root.render(React.createElement(MemoryRouter, null,
  React.createElement("section", { "aria-label": "Actual PWA banner" }, React.createElement(PwaStatus)),
  React.createElement("section", { "aria-label": "Actual offline page" }, React.createElement(Offline)),
  React.createElement(PublicationBoundary),
));
window.pwaSnapshotFixture = { inspect };
document.getElementById("publish-snapshot").addEventListener("click", publish);
document.getElementById("unmount-components").addEventListener("click", () => root.unmount());
`;
  const fixtureEntry = "virtual:pwa-snapshot-fixture.jsx";
  const resolvedFixtureEntry = "\0pwa-snapshot-fixture.jsx";
  const fixtureStore = "\0pwa-snapshot-store.js";
  const bundle = await build({
    configFile: false,
    root: path.resolve("."),
    publicDir: false,
    logLevel: "silent",
    esbuild: { jsx: "automatic" },
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    plugins: [{
      name: "controlled-pwa-consumer-boundary",
      resolveId(id) {
        if (id === fixtureEntry) return resolvedFixtureEntry;
        if (id === "@/lib/pwa" || id === "fixture:pwa-store") return fixtureStore;
        if (id === "lucide-react") return "\0pwa-snapshot-icons.js";
        if (/^@\/components\/layout\/(?:Header|Footer)$/.test(id)) return `\0pwa-snapshot-layout-${path.basename(id)}.js`;
        if (id.startsWith("./src/")) return path.resolve(id);
      },
      load(id) {
        if (id === resolvedFixtureEntry) return entry;
        if (id === fixtureStore) return STORE_SOURCE;
        // Import the same four real icon modules directly. Scanning the entire
        // unrelated icon barrel can exhaust the existing30s hook deadline.
        if (id === "\0pwa-snapshot-icons.js") return iconSource;
        const layout = /^\0pwa-snapshot-layout-(Header|Footer)\.js$/.exec(id);
        if (layout) return `export function ${layout[1]}() { return null; }`;
      },
    }],
    build: {
      write: false, target: "es2022", sourcemap: false, minify: false,
      lib: { entry: fixtureEntry, name: "PwaSnapshotFixture", formats: ["iife"] },
      rollupOptions: { input: fixtureEntry, output: { inlineDynamicImports: true } },
    },
  });
  const outputs = Array.isArray(bundle) ? bundle : [bundle];
  const output = outputs[0];
  if (outputs.length !== 1 || !output || !("output" in output)) throw new Error("Expected one in-memory fixture bundle.");
  const chunks = output.output.filter(item => item.type === "chunk");
  if (chunks.length !== 1) throw new Error("Expected one self-contained fixture script.");
  const javascript = chunks[0].code;
  const requests: Array<{ pathname: string; method: string }> = [];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>PWA snapshot consumer regression</title></head><body>
<h1>Controlled PWA snapshot consumer fixture</h1>
<button id="publish-snapshot">Publish fixture snapshot</button>
<button id="unmount-components">Unmount actual components</button>
<div id="fixture-root"></div><script src="/fixture.js"></script></body></html>`;
  const server = createServer((request, response) => {
    const pathname = new URL(request.url || "/", "http://localhost").pathname;
    requests.push({ pathname, method: request.method || "GET" });
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'");
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (pathname === "/fixture.js") response.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" }).end(javascript);
    else if (pathname === "/") response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(html);
    else response.writeHead(404).end();
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Owned snapshot fixture has no TCP address.");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    requests,
    stop: async () => {
      const closed = new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      server.closeAllConnections();
      await closed;
    },
  };
}

test.use({ serviceWorkers: "block" });
let fixture: Awaited<ReturnType<typeof startSnapshotFixture>>;
test.beforeAll(async () => { fixture = await startSnapshotFixture(); });
test.afterAll(async () => { await fixture?.stop(); });

async function probe(page: Page): Promise<Probe> {
  return page.evaluate(() => (window as Window & { pwaSnapshotFixture: { inspect: () => Probe } }).pwaSnapshotFixture.inspect());
}
async function openScenario(page: Page, scenario: Scenario) {
  const errors: string[] = [], urls: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => urls.push(request.url()));
  await page.goto(`${fixture.origin}/?scenario=${scenario}`);
  await expect.poll(async () => {
    const state = await probe(page);
    return { subscribers: state.activeSubscribers, committed: state.passiveCommitted };
  }).toEqual({ subscribers: 2, committed: true });
  return { errors, urls };
}
async function expectLatestBoth(page: Page) {
  const banner = page.getByRole("region", { name: "Actual PWA banner", exact: true });
  const offline = page.getByRole("region", { name: "Actual offline page", exact: true });
  await expect.poll(async () => ({
    bannerInstall: await banner.getByRole("button", { name: "Install app", exact: true }).isVisible(),
    offlineInstall: await offline.getByRole("button", { name: "Install app", exact: true }).isVisible(),
    offlineReady: (await offline.getByRole("status").textContent()) === READY_MESSAGE,
    offlineAvailable: await offline.getByText("Connection: online · Public download: available", { exact: true }).isVisible(),
  })).toEqual({ bannerInstall: true, offlineInstall: true, offlineReady: true, offlineAvailable: true });
}
function expectOwnedNetwork(observed: { errors: string[]; urls: string[] }) {
  expect(observed.errors).toEqual([]);
  expect(observed.urls.every(value => {
    const url = new URL(value);
    return url.origin === fixture.origin && ["/", "/fixture.js", "/favicon.ico"].includes(url.pathname);
  })).toBe(true);
}

test("actual PWA consumers read a snapshot published before their first render", async ({ page }, info) => {
  const observed = await openScenario(page, "before");
  await expectLatestBoth(page);
  const receipt = await probe(page), publication = receipt.journal.find(entry => entry.kind === "publish")!;
  const read = receipt.journal.find(entry => entry.kind === "read")!;
  expect(publication.subscribers).toBe(0);
  expect(publication.sequence).toBeLessThan(read.sequence);
  expectOwnedNetwork(observed);
  await info.attach("pwa-before-render-control", { contentType: "application/json", body: JSON.stringify(receipt) });
});

test("actual PWA consumers recover a publication between render and passive subscription", async ({ page }, info) => {
  const observed = await openScenario(page, "gap");
  const receipt = await probe(page), publication = receipt.journal.find(entry => entry.kind === "publish")!;
  const read = receipt.journal.find(entry => entry.kind === "read")!;
  const subscription = receipt.journal.find(entry => entry.kind === "subscribe")!;
  expect(receipt.snapshot).toMatchObject({ phase: "ready", installAvailable: true, message: READY_MESSAGE });
  expect(publication.subscribers).toBe(0);
  expect(read.sequence).toBeLessThan(publication.sequence);
  expect(publication.sequence).toBeLessThan(subscription.sequence);
  // Attach the deliberately witnessed schedule before the regression assertion,
  // so the old implementation's expected failure retains its exact evidence.
  await info.attach("pwa-render-to-subscribe-gap", { contentType: "application/json", body: JSON.stringify(receipt) });
  await expectLatestBoth(page);
  expectOwnedNetwork(observed);
});

test("actual PWA consumers observe a publication after both subscriptions exist", async ({ page }, info) => {
  const observed = await openScenario(page, "after");
  const offline = page.getByRole("region", { name: "Actual offline page", exact: true });
  await expect(offline.getByRole("status")).toHaveText(INITIAL_MESSAGE);
  expect((await probe(page)).snapshot.installAvailable).toBe(false);
  await page.getByRole("button", { name: "Publish fixture snapshot", exact: true }).click();
  await expectLatestBoth(page);
  const receipt = await probe(page), publication = receipt.journal.find(entry => entry.kind === "publish")!;
  expect(publication.subscribers).toBe(2);
  expect(receipt.notificationCount).toBe(2);
  expectOwnedNetwork(observed);
  await info.attach("pwa-after-subscription-control", { contentType: "application/json", body: JSON.stringify(receipt) });
});

test("actual PWA consumers release both subscriptions when unmounted", async ({ page }, info) => {
  const observed = await openScenario(page, "unmount");
  await page.getByRole("button", { name: "Publish fixture snapshot", exact: true }).click();
  await expectLatestBoth(page);
  const before = await probe(page);
  await page.getByRole("button", { name: "Unmount actual components", exact: true }).click();
  await expect(page.locator("#fixture-root")).toBeEmpty();
  await expect.poll(async () => (await probe(page)).activeSubscribers).toBe(0);
  await page.getByRole("button", { name: "Publish fixture snapshot", exact: true }).click();
  const after = await probe(page);
  expect(after.unsubscribeCount).toBe(2);
  expect(after.notificationCount).toBe(before.notificationCount);
  expect(after.journal.filter(entry => entry.kind === "publish").at(-1)?.subscribers).toBe(0);
  expectOwnedNetwork(observed);
  await info.attach("pwa-unmount-listener-control", { contentType: "application/json", body: JSON.stringify({ before, after }) });
});
