# Frontend-only deployment

SparowType supports two deployment contracts. `npm run build` and `npm run build:hosting` retain the PHP/MySQL account backend. `npm run build:vercel` and `npm run build:pages` create an explicitly frontend-only application: no PHP server, database, API key or account secret is required.

Frontend-only installations retain guest tests, adaptive practice, the structured course, local bots, Signal Run, all eight arcade modes, local progression, Studio, manual classroom reports, local history/statistics, preferences, JSON/image export and the public offline download. Account signup/signin/sync, friends/issued duels, Arena, public rankings, server-issued challenges and server classroom assignments need the separate PHP service and are unavailable in this mode. The application does not fabricate successful account saves or opponent scores. Static build commands force the API transport off even when a developer's environment contains `VITE_API_BASE_URL`.

Local records belong to the browser origin and existing owner scope. Moving from localhost to a hosted domain does not transfer IndexedDB or preferences. Export important records before changing origins. A static installation does not reveal or reassign old account-scoped data; it runs as a guest. Browser storage restrictions, eviction and private browsing can still limit persistence.

## Vercel

1. Import the GitHub repository into Vercel as a Vite project.
2. Keep the checked-in `vercel.json`: its build command is `npm run build:vercel`, output directory `dist`, with SPA fallback and response security headers. The repository root is the project root.
3. Deploy through Vercel when ready. This implementation does not create a remote project or deployment for you.

No environment variable is required for basic operation. For the production canonical URL and sitemap, set `SPAROWTYPE_SITE_URL` to the actual HTTPS site URL ending in `/`. A production Vercel build can also use Vercel's provided production hostname. Preview deployments without a declared production origin use their current origin for runtime metadata and omit the generated sitemap. Do not put database credentials in any `VITE_` variable.

Build the same artifact locally:

```sh
npm ci
npm run build:vercel
npm run preview -- --host 127.0.0.1 --port 4173
```

To declare a production origin explicitly:

```sh
npm run build:vercel -- --site-url https://typing.example.com/
```

The hostname above is an example, not a configured SparowType domain. Vercel serves the app at `/`; PHP hosting remains a different build command and delivery package.

## GitHub Pages

The build supports project sites (`https://owner.github.io/repository/`), account sites (`https://owner.github.io/`) and configured custom domains. Its asset base, router basename, fonts, manifest, service worker, recovery links and metadata use the same application path.

```sh
npm ci
npm run build:pages -- --repository owner/repository
```

Replace the example repository with the actual GitHub owner/name. An account-site repository named `owner.github.io` automatically uses `/`. For a configured custom domain, pass its real public site URL instead:

```sh
npm run build:pages -- --site-url https://typing.example.com/
```

The build emits real `index.html` entries for supported routes, including `/lessons`, `/games`, `/stats`, `/settings` and `/race`. GitHub Pages can serve and refresh these directories without a hash router or a script that disguises HTTP404 responses as successful navigation. Its usual trailing-slash redirect is compatible with the router. Unknown paths receive `404.html` and remain genuine HTTP404s; dynamic human-room links require PHP hosting and are unsupported on the static site.

For the prepared Actions workflow:

1. In repository **Settings → Pages**, select **GitHub Actions** as the publishing source.
2. Run **Build frontend for GitHub Pages** from the Actions tab. It is intentionally manual; ordinary source pushes do not publish a site automatically.
3. Approve the repository's `github-pages` environment if GitHub requires it.

The workflow uses Pages metadata for the public URL/base, uploads only `dist`, and uses the built-in `GITHUB_TOKEN`/OIDC permissions. No manually created deployment token or database secret is required. Configure custom domains in Pages settings before building; this workflow does not invent or overwrite a domain. The workflow is configured here; remote Actions execution and actual hosting acceptance must be checked in the destination repository.

## Offline behavior and path isolation

The public service worker precaches emitted JavaScript, CSS, self-hosted fonts, icons and the generic shell. A frontend-only offline shell exposes local practice, lessons, games, statistics and settings after the initial download has completed. Network/API responses and private JSON are not cached. Installation and offline availability still depend on browser support, secure hosting and storage permission.

Each subpath uses its own worker scope and cache namespace. Removing the public download for `/repository/` does not delete another project's download or local typing history. GitHub Pages hosts multiple project sites on one origin; local storage is still origin-scoped, so do not treat separate repository paths as a security boundary for personal records.

The initial brand social image and canonical URLs point inside the configured base. Route metadata updates in the browser; this remains a client-rendered application rather than server-rendered editorial content. Only public routes enter the sitemap. Static account/profile/ranking routes are marked `noindex`, and unknown-route HTML has no canonical URL.

## Verification and PHP compatibility

```sh
npm run test:run -- src/lib/__tests__/deployment.test.ts src/lib/__tests__/pwa-build.test.ts src/lib/__tests__/pwa-worker.test.ts
npm run typecheck
```

Use dedicated output directories when comparing builds without replacing another local production preview:

```sh
npm run build:vercel -- --out-dir dist-static-vercel
npm run build:pages -- --repository owner/repository --out-dir dist-static-pages
npm run test:frontend
```

The static acceptance suite serves those artifacts from disposable loopback origins with real directory indexes and no SPA rewrite. It checks direct nested-route refresh, guest saves/exports, lesson checkpoints, disabled server features, scoped assets and a service-worker download during an actual origin outage. Set `PLAYWRIGHT_BROWSERS=chromium,edge,firefox,webkit` in your shell to run every installed browser sequentially; the default is Chromium. This command does not start or modify PHP/MySQL.

Only `dist` or a dedicated `dist-static-name` directory is accepted by the static helper. These generated directories are ignored by Git. Their public `deployment.json` records the target/base/backend-disabled contract without credentials. Builds do not copy `backend/config.php`, local storage, database files or PHP account data into the static artifact.

To return to the complete PHP deployment, use `npm run build:hosting` and the [PHP/XAMPP hosting guide](PHP_XAMPP_SETUP.md). Static builds cannot be turned into functioning account services by adding a URL after deployment; rebuild with the PHP contract and configure the actual server, sessions, origin and database.

The local Vite development server preserves Vite's default file-deny rules and also denies PHP credentials, local backend configuration, backend storage and generated PHP hosting packages/archives/staging directories. Public course resources remain available to the application, and `/api` retains its configured PHP proxy. This is a development file-serving boundary; production PHP/Apache and static-provider security use their own deployment configuration. The loopback boundary regression requests only a newly created nonsecret storage canary and an isolated API fixture, never real credentials or account data.

Final after5 verification on 20 October 2026 passed 97 focused deployment/PWA/SEO/transport/opening-plugin checks across eight files, 28 artifact checks and 40 static browser acceptance cases: ten each in Chromium, installed Microsoft Edge, Firefox and Playwright WebKit. The verified Vercel build is `58cb916b8e935b5513e1`; the Pages project-subpath build is `f1ad3223c9b023efde27`. Both artifacts were served by a real directory server with no SPA fallback. The game also had zero axe violations across ready, playing and completed states at 390 and 1440 pixels on both targets in Chromium: four cases and twelve state readings. Scene, bloom and Three.js rendering chunks remain byte-identical across targets and to the retained baseline; the worker bridge has its separately documented lifecycle repair. All 229 captured production source/config files stayed unchanged during this acceptance window. Earlier after1 and after4 checkpoints and initial fixture failures remain preserved. These are local checks, not certification of actual iOS Safari, Vercel infrastructure or a published GitHub Pages site. Sanitized evidence is in `audit/mobile-games-static-2026-10-20/static-verification-summary.json`.

## Sources

Checked 20 October 2026: [Vite's static deployment guide](https://vite.dev/guide/static-deploy.html) specifies project versus account-site bases and a Pages Actions build. [Vercel's Vite guide](https://vercel.com/docs/frameworks/frontend/vite) documents SPA deep-link rewrites; [its project configuration reference](https://vercel.com/docs/project-configuration/vercel-json) covers build/output/header settings. [GitHub's custom Pages workflow guide](https://docs.github.com/en/enterprise-cloud%40latest/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) explains artifact deployment, environment and token permissions. Hosting providers can change these settings; local tests do not establish a successful public deployment.
