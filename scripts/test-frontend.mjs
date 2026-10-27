import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
const outputs = ["dist-static-vercel", "dist-static-pages"];
for (const output of outputs) {
  const data = JSON.parse(
    await readFile(path.join(output, "deployment.json"), "utf8"),
  );
  if (!data.frontendOnly || data.api !== "disabled")
    throw new Error(
      `Rebuild ${output} with the corresponding static command first.`,
    );
}
const child = spawn(
  process.execPath,
  [
    "node_modules/@playwright/test/cli.js",
    "test",
    "e2e/frontend-deployment.spec.ts",
    "--workers=1",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      SPAROWTYPE_STATIC_OUTPUTS: outputs.join(","),
      PLAYWRIGHT_BASE_URL: "http://127.0.0.1",
    },
  },
);
child.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
