import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { startFrontendStaticServer } from "./frontend-static-server";
import { exportedResult, focusTyping } from "./helpers";
import { GAMES } from "../src/games/modes/catalog";
import type { GameEvidence } from "../src/games/engine/types";

const outputs = (process.env.SPAROWTYPE_STATIC_OUTPUTS || "")
  .split(",")
  .filter(Boolean);
test.skip(
  outputs.length === 0,
  "Run npm run test:frontend after building the dedicated static artifacts.",
);

for (const directory of outputs)
  test.describe(directory, () => {
    let server: Awaited<ReturnType<typeof startFrontendStaticServer>>;
    const errors: string[] = [],
      requests: string[] = [];
    const goto = (page: Page, route = "") =>
      page.goto(new URL(route, server.baseURL).href);
    test.beforeEach(async ({ page }) => {
      server = await startFrontendStaticServer(directory);
      errors.length = requests.length = 0;
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => requests.push(request.url()));
      await page.addInitScript(() =>
        localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
      );
    });
    test.afterEach(async ({ page }, info) => {
      await server.stop();
      await info.attach("static-network-ledger", {
        body: JSON.stringify(
          { deployment: server.deployment, requests: server.requests, errors, finalPath: new URL(page.url()).pathname },
          null,
          2,
        ),
        contentType: "application/json",
      });
      expect(errors).toEqual([]);
      const base = new URL(server.baseURL);
      expect(
        requests.filter((value) => {
          const url = new URL(value);
          return (
            ["http:", "https:"].includes(url.protocol) &&
            (url.origin !== base.origin ||
              !url.pathname.startsWith(base.pathname) ||
              /^\/(?:api|auth\/v1|rest\/v1|functions\/v1)(?:\/|$)/.test(
                url.pathname.slice(base.pathname.length - 1),
              ))
          );
        }),
      ).toEqual([]);
    });

    test("real nested route files, fonts, manifest, metadata and unknown HTTP404", async ({
      page,
      request,
    }) => {
      for (const route of [
        "",
        "learn",
        "lessons",
        "games",
        "stats",
        "settings",
        "keyboard-lab",
        "privacy",
      ]) {
        const response = await goto(page, route);
        expect(response?.status()).toBe(200);
        await expect(page.locator("#main-content")).toBeVisible();
        expect(
          new URL(page.url()).pathname.startsWith(server.deployment.base),
        ).toBe(true);
        await page.reload();
        await expect(page.locator("#main-content")).toBeVisible();
      }
      const manifest = await request.get(
        new URL("site.webmanifest", server.baseURL).href,
      );
      const data = await manifest.json();
      expect(data).toMatchObject({
        scope: server.deployment.base,
        start_url: server.deployment.base,
        id: server.deployment.base,
      });
      expect(
        data.icons.every((icon: { src: string }) =>
          icon.src.startsWith(server.deployment.base),
        ),
      ).toBe(true);
      await expect
        .poll(() => page.evaluate(() => [...document.fonts].some(font => font.family.replaceAll('"', '').replaceAll("'", '') === "Sora" && font.status === "loaded")))
        .toBe(true);
      const origin = new URL(server.deployment.siteUrl || server.baseURL).origin;
      const slash = server.deployment.target === "github-pages" ? "/" : "";
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}${server.deployment.base}privacy${slash}`);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${origin}${server.deployment.base}og-sparowtype.png`);
      const unknown = await request.get(
        new URL("does-not-exist", server.baseURL).href,
      );
      expect(unknown.status()).toBe(404);
      expect(await unknown.text()).toContain("noindex,nofollow");
      expect(
        server.requests.filter(
          (record) =>
            record.status >= 400 &&
            record.path !== new URL(unknown.url()).pathname,
        ),
      ).toEqual([]);
    });

    test("account, human rooms and rankings are unavailable honestly while bot practice starts", async ({
      page,
    }) => {
      await goto(page, "auth");
      await expect(
        page.getByText(
          "Account services are unavailable. Guest practice and local history are ready.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Sign In", exact: true }),
      ).toBeDisabled();
      await goto(page, "ranked");
      await expect(
        page.getByText(/Ranked challenges require a server\./),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Sign in to start", exact: true }),
      ).toHaveCount(0);
      await goto(page, "race");
      await expect(
        page.getByText(/Human races require a server\./),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Start bot practice", exact: true })
        .click();
      await expect(
        page.getByRole("textbox", { name: "Typing input", exact: true }),
      ).toBeVisible();
      await goto(page, "leaderboard");
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(
        page
          .getByText(/not configured|unavailable|requires? a server/i)
          .first(),
      ).toBeVisible();
    });

    test("guest correction evidence saves, exports and appears in local history", async ({
      page,
    }) => {
      await goto(page);
      await page
        .getByRole("group", { name: "Test mode", exact: true })
        .getByRole("button", { name: "Custom", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "Custom practice passage", exact: true })
        .fill("cat");
      await page
        .getByRole("button", { name: "Start private practice", exact: true })
        .click();
      const input = await focusTyping(page);
      await input.pressSequentially("cx", { delay: 65 });
      await input.press("Backspace");
      await input.pressSequentially("at", { delay: 65 });
      await expect(
        page.getByRole("region", { name: "Session results", exact: true }),
      ).toBeVisible();
      const result = await exportedResult(page);
      expect(result.finalText).toBe("cat");
      expect(result.metrics.inputAccuracy).toBe(75);
      await expect(
        page.getByText(/saved on this device/i).first(),
      ).toBeVisible();
      await goto(page, "stats");
      await expect(
        page.getByRole("row").filter({ hasText: "custom" }).getByRole("cell", { name: "75.0%", exact: true }),
      ).toBeVisible();
      await goto(page, "settings");
      const pending = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Export my local data", exact: true })
        .click();
      const download = await pending;
      const data = JSON.parse(await readFile((await download.path())!, "utf8"));
      expect(data.sessions).toHaveLength(1);
      expect(data.sessions[0].summary.accuracy).toBe(75);
      const language = page.getByRole("combobox", {
        name: "Practice language",
        exact: true,
      });
      await language.selectOption("es");
      await page.reload();
      await expect(language).toHaveValue("es");
    });

    test("a structured lesson saves local checkpoint evidence", async ({
      page,
    }) => {
      await goto(page, "lessons?lesson=home-anchors");
      await page
        .getByRole("button", { name: "Start lesson", exact: true })
        .click();
      const text = await page.getByTestId("typing-target").innerText();
      await (await focusTyping(page)).pressSequentially(text, { delay: 65 });
      await expect(
        page.getByRole("region", { name: "Course lesson result", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".course-save-status")).toContainText(
        "Saved on this device.",
      );
      await expect(
        page.getByRole("heading", { name: "Checkpoint earned.", exact: true }),
      ).toBeVisible();
    });

    test("all eight arcade deep links reload and produce real local input evidence under the deployment base", async ({ page }, info) => {
      // Sixteen genuine document loads/reloads plus eight native game/export
      // journeys share one bounded case; no game waits for an Endless deadline.
      test.setTimeout(90_000);
      const measured: { gameId: string; path: string; attempts: number; incorrect: number; verification: string }[] = [];
      for (const game of GAMES) {
        const response = await goto(page, `arcade/${game.id}`);
        expect(response?.status()).toBe(200);
        await expect(page.getByRole("heading", { name: game.name, exact: true })).toBeVisible();
        expect(new URL(page.url()).pathname.replace(/\/$/, "")).toBe(`${server.deployment.base}arcade/${game.id}`);
        expect((await page.reload())?.status()).toBe(200);
        await expect(page.getByRole("heading", { name: game.name, exact: true })).toBeVisible();
        await page.getByRole("combobox", { name: "Arcade difficulty", exact: true }).selectOption("easy");
        await page.getByRole("button", { name: `Play ${game.name}`, exact: true }).click();
        const input = page.getByRole("textbox", { name: "Arcade typing input", exact: true });
        await expect(input).toBeEnabled();
        await page.locator(".arcade-target-alternative summary").click();
        const word = (await page.locator(".arcade-target-alternative li").first().textContent())!.split(" · ")[0];
        expect(word).toMatch(/^[a-z]+$/);
        await input.focus();
        await input.pressSequentially("#" + word, { delay: 25 });
        await expect(input).toHaveValue("");
        await page.getByRole("button", { name: "End run", exact: true }).click();
        const result = page.getByRole("region", { name: "Arcade result", exact: true });
        await expect(result).toContainText("LOCAL PRACTICE");
        await expect(result).toContainText("A local score is not a verified ranking.");
        const pending = page.waitForEvent("download");
        await result.getByRole("button", { name: "Export canonical game JSON", exact: true }).click();
        const download = await pending, file = await download.path(); expect(file).not.toBeNull();
        const evidence = JSON.parse(await readFile(file!, "utf8")) as GameEvidence;
        expect(evidence.gameId).toBe(game.id); expect(evidence.verification).toBe("local-unverified");
        expect(evidence.session.ownerScope).toBe("guest");
        expect(evidence.session.configuration.settings?.arcadeGame).toBe(game.id);
        expect(evidence.session.configuration.settings?.localOnly).toBe(true);
        expect(evidence.session.metrics.insertionAttempts).toBe(word.length + 1);
        expect(evidence.session.metrics.correctAttempts).toBe(word.length);
        expect(evidence.session.metrics.incorrectAttempts).toBe(1);
        expect(evidence.session.metrics.inputAccuracy).toBeCloseTo(word.length / (word.length + 1) * 100);
        expect(evidence.session.finalTranscript).toBe(word);
        await expect.poll(() => page.evaluate(id => JSON.parse(localStorage.getItem("sparowtype.arcade.v1:guest") || "{}").bests?.some((best: { gameId: string }) => best.gameId === id), game.id)).toBe(true);
        measured.push({ gameId: game.id, path: new URL(page.url()).pathname, attempts: evidence.session.metrics.insertionAttempts, incorrect: evidence.session.metrics.incorrectAttempts, verification: evidence.verification });
      }
      await goto(page, "arcade");
      await expect(page.locator(".arcade-card")).toHaveCount(8);
      for (const game of GAMES) await expect(page.getByRole("link", { name: `Open ${game.name}`, exact: true })).toHaveAttribute("href", `${server.deployment.base}arcade/${game.id}`);
      expect(server.requests.filter(record => record.status >= 400)).toEqual([]);
      await info.attach("static-eight-game-native-evidence", { contentType: "application/json", body: JSON.stringify({ deployment: server.deployment, mockedApis: false, realNativeInput: true, measured, scope: "Local practice only; server verification and physical phone input are not inferred." }, null, 2) });
    });

    test("new guest tools persist locally while friends and arena disclose missing backend on direct reload", async ({ page }, info) => {
      const direct = async (route: string) => {
        expect((await goto(page, route))?.status()).toBe(200);
        expect(new URL(page.url()).pathname.replace(/\/$/, "")).toBe(`${server.deployment.base}${route}`);
        expect((await page.reload())?.status()).toBe(200);
        await expect(page.locator("main#main-content")).toBeVisible();
      };
      await direct("studio");
      await expect(page.getByRole("heading", { name: "Practice studio", exact: true })).toBeVisible();
      const appearance = page.getByRole("group", { name: "Keyboard appearance", exact: true });
      await appearance.getByRole("button", { name: "Outline", exact: true }).click();
      await page.reload();
      await expect(appearance.getByRole("button", { name: "Outline", exact: true })).toHaveAttribute("aria-pressed", "true");
      await direct("progression");
      await expect(page.getByRole("heading", { name: /^Level \d+ / })).toBeVisible();
      await expect(page.getByText("On this device · unverified", { exact: true })).toBeVisible();
      const progressionDownload = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export reward receipts", exact: true }).click();
      const progressionFile = await (await progressionDownload).path(); expect(progressionFile).not.toBeNull();
      const progression = JSON.parse(await readFile(progressionFile!, "utf8"));
      expect(progression.ownerId).toBe("guest"); expect(progression.verification).toBe("local");
      await direct("classroom");
      await expect(page.getByRole("heading", { name: "Classroom lite", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Server classroom", exact: true })).toBeDisabled();
      await page.getByRole("textbox", { name: "Classroom title", exact: true }).fill("Static guest practice");
      await page.getByRole("button", { name: "Create device-only classroom", exact: true }).click();
      const code = await page.getByRole("region", { name: "New private class code", exact: true }).locator("code").innerText();
      await page.getByRole("button", { name: "Hide code", exact: true }).click();
      await page.getByText("Add a manually reported alias", { exact: true }).click();
      await page.getByRole("textbox", { name: "Student alias, without an email", exact: true }).fill("Learner-static");
      await page.getByRole("button", { name: "Add unverified manual report", exact: true }).click();
      await page.reload();
      const classroom = page.getByRole("region", { name: "Classroom Static guest practice", exact: true });
      await expect(classroom.getByRole("rowheader", { name: "Learner-static", exact: true })).toBeVisible();
      const classroomDownload = page.waitForEvent("download");
      await classroom.getByRole("button", { name: "Export aggregates", exact: true }).click();
      const classroomFile = await (await classroomDownload).path(); expect(classroomFile).not.toBeNull();
      const classroomText = await readFile(classroomFile!, "utf8"), aggregate = JSON.parse(classroomText);
      expect(classroomText).not.toContain(code); expect(aggregate.source).toBe("device-only-manual-unverified");
      expect(aggregate.members).toHaveLength(1); expect(aggregate.members[0]).toMatchObject({ alias: "Learner-static", verification: "manual-unverified", insertionAttempts: 100, correctAttempts: 98 });
      await direct("friends");
      await expect(page.getByRole("heading", { name: "Private contacts use an account server", exact: true })).toBeVisible();
      await expect(page.locator("main#main-content").getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Send private request", exact: true })).toHaveCount(0);
      await direct("arena");
      await expect(page.getByRole("heading", { name: "This frontend build supports local practice.", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Create eight-seat room", exact: true })).toHaveCount(0);
      await expect(page.locator("main#main-content").getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Practise with a labelled bot", exact: true })).toHaveAttribute("href", `${server.deployment.base}race`);
      expect(server.requests.filter(record => record.status >= 400)).toEqual([]);
      await info.attach("static-new-tool-boundaries", { contentType: "application/json", body: JSON.stringify({ deployment: server.deployment, mockedApis: false, studioOutlinePersisted: true, progressionOwner: progression.ownerId, progressionVerification: progression.verification, classroomSource: aggregate.source, manualRows: aggregate.members.length, friendsAndArena: "Backend unavailable; no fake contacts, peers or sign-in call to action." }, null, 2) });
    });

    test("a completed public download reopens the game and local pages during a real origin outage", async ({
      page,
      context,
    }) => {
      test.setTimeout(60_000);
      await goto(page, "offline");
      await expect(page.getByText(/Public download: available/)).toBeVisible({
        timeout: 30_000,
      });
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller)
          await new Promise<void>((resolve) =>
            navigator.serviceWorker.addEventListener(
              "controllerchange",
              () => resolve(),
              { once: true },
            ),
          );
      });
      const registration = await page.evaluate(
        async () => (await navigator.serviceWorker.ready).scope,
      );
      expect(registration).toBe(server.baseURL);
      await server.stop();
      await context.setOffline(true);
      await goto(page, "games");
      await expect(page.getByTestId("signal-run")).toHaveAttribute(
        "data-phase",
        "ready",
      );
      await page
        .getByRole("button", { name: "Start calm journey", exact: true })
        .click();
      const word = (await page
        .getByTestId("game-target")
        .getAttribute("aria-label"))!.replace("Target word: ", "");
      const input = page.getByRole("textbox", {
        name: "Your word",
        exact: true,
      });
      await input.pressSequentially(word);
      await input.press("Enter");
      await expect(page.getByTestId("game-gates")).toHaveText("1 / 18");
      for (const route of ["learn", "lessons", "stats", "settings"]) {
        await goto(page, route);
        await expect(page.locator("#main-content")).toBeVisible();
      }
    });
  });
