import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveDeploymentConfig,
  resolvePagesLocation,
} from "../build/deployment-config.mjs";
import { buildOffline } from "./build-offline.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [target, ...args] = process.argv.slice(2);
if (!["vercel", "github-pages"].includes(target))
  throw new Error(
    "Choose vercel or github-pages. PHP builds continue to use npm run build.",
  );
const values = {};
for (let index = 0; index < args.length; index += 2) {
  if (
    !["--repository", "--site-url", "--out-dir"].includes(args[index]) ||
    !args[index + 1] ||
    args[index + 1].startsWith("--")
  )
    throw new Error(
      "Supported options: --repository owner/repository, --site-url https://host/base/, --out-dir dist-static-name.",
    );
  values[args[index]] = args[index + 1];
}
const outputName = values["--out-dir"] || "dist";
if (!/^(?:dist|dist-static-[A-Za-z0-9_-]+)$/.test(outputName))
  throw new Error(
    "Static output must be dist or a dedicated dist-static-name directory in this workspace.",
  );
let siteUrl = values["--site-url"] || process.env.SPAROWTYPE_SITE_URL || "";
let base = "/";
if (target === "github-pages")
  ({ base, siteUrl } = resolvePagesLocation(
    values["--repository"] || process.env.GITHUB_REPOSITORY,
    siteUrl,
  ));
else if (!siteUrl && process.env.VERCEL_ENV === "production") {
  const hostname =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (hostname) siteUrl = `https://${hostname}/`;
}
const environment = {
  ...process.env,
  SPAROWTYPE_DEPLOY_TARGET: target,
  SPAROWTYPE_BASE_PATH: base,
  SPAROWTYPE_SITE_URL: siteUrl,
  VITE_API_BASE_URL: "disabled",
};
resolveDeploymentConfig(environment);
const child = spawn(
  process.execPath,
  [
    path.join(root, "node_modules/vite/bin/vite.js"),
    "build",
    "--outDir",
    outputName,
  ],
  { cwd: root, env: environment, stdio: "inherit", windowsHide: true },
);
const code = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", resolve);
});
if (code !== 0) process.exit(Number(code) || 1);
const offline = await buildOffline(path.join(root, outputName), environment);
console.log(
  `Frontend-only ${target} build prepared at ${outputName}; base ${base}; account services disabled; offline version ${offline.version}.`,
);
