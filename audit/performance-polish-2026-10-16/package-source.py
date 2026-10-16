"""Create a verified, secret-screened full-source delivery after final audit sign-off.

Only the Python standard library is required. Importing this module never writes files.
Do not run until the coordinating agent declares the final audit ready.
"""
from __future__ import annotations

import base64
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = Path(__file__).resolve().parent
INCLUDED_AUDITS = {EVIDENCE.name, 'keyboard-awakens-2026-10-16'}
EXCLUDED_DIRS = {
    '.git', '.cursor', '.idea', '.vscode', 'node_modules', 'dist', 'dist-ssr',
    'delivery', 'coverage', 'playwright-report', 'test-results', '.cache', '.temp',
    '__pycache__', '.pytest_cache', '.vite', '.vercel', '.netlify', 'target',
}
ARCHIVE_ENDINGS = ('.zip', '.tar', '.tar.gz', '.tar.bz2', '.tar.xz', '.tar.zst', '.tgz', '.7z', '.rar', '.bak', '.orig')
PRIVATE_SUFFIXES = {'.pem', '.key', '.p12', '.pfx', '.jks', '.keystore', '.kdbx'}
PRIVATE_NAMES = {
    '.npmrc', '.yarnrc', '.yarnrc.yml', '.netrc', '_netrc', 'credentials.json',
    'service-account.json', 'id_rsa', 'id_ed25519', 'id_ecdsa', '.DS_Store',
}
LANGUAGES = {
    '.tsx': 'tsx', '.ts': 'typescript', '.js': 'javascript', '.mjs': 'javascript',
    '.cjs': 'javascript', '.json': 'json', '.md': 'markdown', '.sql': 'sql',
    '.css': 'css', '.html': 'html', '.svg': 'xml', '.yml': 'yaml', '.yaml': 'yaml',
    '.toml': 'toml', '.py': 'python', '.sh': 'sh', '.ps1': 'powershell',
}
SECRET_PATTERNS = {
    'private-key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----'),
    'aws-access-key': re.compile(r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    'github-token': re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{35,})\b'),
    'slack-token': re.compile(r'\bxox[baprs]-[A-Za-z0-9-]{20,}\b'),
    'stripe-private-key': re.compile(r'\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b'),
    'supabase-secret-key': re.compile(r'\bsb_secret_[A-Za-z0-9_-]{16,}\b'),
    'openai-private-key': re.compile(r'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{36,}\b'),
}
JWT = re.compile(r'\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{8,}\b')
ASSIGNED_SECRET = re.compile(
    r'''(?ix)\b(?:supabase_service_role_key|service_role_key|client_secret|api_secret|private_key|access_token|refresh_token|password)\b["']?\s*[:=]\s*["']([^"'\r\n]{16,})["']'''
)
PLACEHOLDER = re.compile(r'(?i)(?:example|placeholder|dummy|fake|test[-_ ]|not[-_ ]real|your[-_ ]|<[^>]+>|\$\{|process\.env|import\.meta\.env)')


def is_link(path: Path) -> bool:
    attributes = getattr(path.lstat(), 'st_file_attributes', 0)
    return path.is_symlink() or bool(attributes & getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0))


def inventory() -> tuple[list[Path], list[dict[str, str]]]:
    paths: list[Path] = []
    omitted: list[dict[str, str]] = []
    for current, directories, names in os.walk(ROOT, topdown=True, followlinks=False):
        parent = Path(current)
        retained = []
        for name in sorted(directories):
            child = parent / name
            relative = child.relative_to(ROOT)
            reason = None
            if name in EXCLUDED_DIRS:
                reason = 'dependency, generated output, editor state or retained checkout'
            elif relative.parts[0] == 'audit' and len(relative.parts) == 2 and child.name not in INCLUDED_AUDITS:
                reason = 'prior audit; current audit is included separately'
            if reason:
                omitted.append({'path': relative.as_posix() + '/', 'reason': reason})
            elif is_link(child):
                raise RuntimeError(f'Refusing a symlink/junction directory: {relative.as_posix()}')
            else:
                retained.append(name)
        directories[:] = retained
        for name in sorted(names):
            path = parent / name
            relative = path.relative_to(ROOT).as_posix()
            reason = None
            if name.startswith('.env') and name != '.env.example':
                reason = 'local environment configuration'
            elif name in PRIVATE_NAMES or path.suffix.lower() in PRIVATE_SUFFIXES:
                reason = 'credential/key material or machine-local configuration'
            elif name.lower().endswith(ARCHIVE_ENDINGS):
                reason = ('large Playwright trace archive retained locally; raw outcome JSON, decoded receipts and diagnostic images are packaged'
                          if name == 'trace.zip' and relative.startswith('audit/')
                          else 'retained archive/snapshot; current files are packaged directly')
            elif name.endswith(('.log', '.local', '.pyc', '.tmp', '~')):
                reason = 'local/generated temporary output'
            if reason:
                omitted.append({'path': relative, 'reason': reason})
                continue
            if is_link(path) or not path.resolve().is_relative_to(ROOT):
                raise RuntimeError(f'Refusing an indirect file path: {relative}')
            if path.is_file():
                paths.append(path)
    return sorted(paths, key=lambda path: path.relative_to(ROOT).as_posix()), omitted


def readable(data: bytes) -> str | None:
    try:
        text = data.decode('utf-8')
    except UnicodeDecodeError:
        return None
    return text if '\0' not in text else None


def screen_secrets(entries: list[dict]) -> dict:
    findings = []
    public_jwts = 0
    for entry in entries:
        text = readable(entry['data'])
        if text is None:
            continue
        if entry['path'] == '.env.example':
            for line, value in enumerate(text.splitlines(), 1):
                if value.strip() and not value.lstrip().startswith('#') and '=' in value and value.split('=', 1)[1].strip():
                    findings.append({'path': entry['path'], 'line': line, 'kind': 'nonempty-environment-template'})
        for kind, pattern in SECRET_PATTERNS.items():
            for match in pattern.finditer(text):
                if not PLACEHOLDER.search(match.group()):
                    findings.append({'path': entry['path'], 'line': text.count('\n', 0, match.start()) + 1, 'kind': kind})
        for match in JWT.finditer(text):
            try:
                middle = match.group().split('.')[1]
                payload = json.loads(base64.urlsafe_b64decode(middle + '=' * (-len(middle) % 4)))
                role = payload.get('role') if isinstance(payload, dict) else None
                if role in {'service_role', 'supabase_admin', 'supabase_auth_admin', 'postgres'}:
                    findings.append({'path': entry['path'], 'line': text.count('\n', 0, match.start()) + 1, 'kind': 'privileged-jwt'})
                elif role == 'anon':
                    public_jwts += 1  # Public browser configuration is not a privileged secret.
            except (ValueError, UnicodeDecodeError):
                pass
        for match in ASSIGNED_SECRET.finditer(text):
            value = match.group(1)
            if JWT.fullmatch(value):
                try:
                    middle = value.split('.')[1]
                    payload = json.loads(base64.urlsafe_b64decode(middle + '=' * (-len(middle) % 4)))
                    if isinstance(payload, dict) and payload.get('role') == 'anon':
                        continue
                except (ValueError, UnicodeDecodeError):
                    pass
            if not PLACEHOLDER.search(value) and not re.fullmatch(r'[a-zA-Z _./-]+', value):
                findings.append({'path': entry['path'], 'line': text.count('\n', 0, match.start()) + 1, 'kind': 'hardcoded-credential-assignment'})
    unique = sorted({(item['path'], item['line'], item['kind']) for item in findings})
    if unique:
        # Values and matching source lines are deliberately never printed.
        raise RuntimeError('Secret screening requires review at these locations only: ' + json.dumps(unique))
    return {
        'result': 'No high-confidence privileged key or hardcoded credential pattern detected in included UTF-8 text.',
        'publicAnonJwtOccurrences': public_jwts,
        'limitations': 'Pattern screening is not a universal secret/security audit. Environment/key files are excluded. Public Supabase anon/publishable client configuration is not a service credential.',
    }


def delivery_readme() -> str:
    return '''# SparowType complete project delivery

This is an uncommitted local working-tree snapshot, not a published or hosted release.
Read docs/PERFORMANCE_POLISH_AUDIT_2026-10-16.md for the current findings, actual test results,
retained failures, repairs and remaining release gates. The earlier detailed product audit is
docs/KEYBOARD_AWAKENS_PRODUCT_AUDIT_2026-10-16.md. Research is in
docs/KEYBOARD_AWAKENS_RESEARCH_2026-10-16.md. Earlier root reports describe older versions.

## What is included

- src/: React workspaces, typing metrics, learning, races, results, preferences and opening.
- public/: complete original binary fonts, images/icons, licenses, offline entry and host rules.
- supabase/: migrations, Edge functions, scheduled-job SQL and local SQL compatibility checks.
- build/, e2e/, scripts/, .github/: Vite worker/critical-style plugins, browser acceptance,
  verification tooling and CI definitions.
- docs/, root configuration and locked npm/bun dependency manifests.
- audit/performance-polish-2026-10-16/: current reports, commands, original test outcome
  JSON, decoded native receipts, diagnostic screenshots, plain CDP profiles/traces and
  failed checkpoints; failures are not converted into passes.
- audit/keyboard-awakens-2026-10-16/: retained preceding detailed audit and evidence.
- audit/workman-windows-source.klc: plain-source keyboard-layout reference retained with the project.

SOURCE_MANIFEST.json records every archived payload path, byte length and SHA-256.
The manifest itself is the sole self-hash exception. Recompute individual file hashes
against it after extraction. The separate SHA256SUMS file verifies the ZIP, manifest,
delivery README and complete text packet. The packet reproduces every included UTF-8
source and current/retained audit text file in full. Binary files are listed in the manifest and
are preserved byte-for-byte in the ZIP, not encoded into the Markdown.

Local .env files, credentials/private keys, node_modules, dist, coverage, browser report
output, Git/editor state, older audit folders except the retained Keyboard Awakens audit, retained archives and checkout
snapshots are excluded. Exclusions are itemized in the manifest. Text is screened for
high-confidence privileged secrets before writing. This does not guarantee that every
possible secret was found. Supabase public anon/publishable browser keys are public
configuration; privileged service-role keys must remain server-side.

Large Playwright trace.zip archives remain preserved in the local audit folders and
are excluded from this source delivery. Their original outcome JSON/logs, decoded
receipts, trace findings and failure screenshots are included. The manifest itemizes
the omitted archive paths. Plain JSON/CPU diagnostic profiles are included in full.

## Run and verify

Requires Node.js 22.12+, npm 10+, and Python 3.11+ plus Rust for the content compiler gate.
Extract the SparowType folder, open a terminal there, then:

```powershell
npm ci
npm run dev
```

Development normally opens at http://localhost:8080. Guest typing/local history works
without cloud credentials. .env.example contains empty public fields; supply your own
public Supabase configuration only when testing a properly migrated backend.

```powershell
npm run typecheck
npm run lint
npm run test:coverage -- --maxWorkers=2
npm run test:database
npm run test:content
npm run build
npm run check:bundle
npx playwright install chromium firefox webkit
$env:PLAYWRIGHT_BROWSERS = "all"
npm run test:e2e -- --workers=1 --trace=off
```

Without PLAYWRIGHT_BASE_URL, E2E starts the development server. For the built artifact,
run this in one terminal after building:

```powershell
npm run preview -- --host 127.0.0.1 --port 4175 --strictPort
```

Then run in another terminal:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:4175"
$env:PLAYWRIGHT_BROWSERS = "all"
npm run test:e2e -- --workers=1 --trace=off
```

To reproduce the installed Microsoft Edge project against that preview (Edge must
already be installed), select it explicitly; `all` means Chromium/Firefox/WebKit:

```powershell
$env:PLAYWRIGHT_BROWSERS = "edge"
npm run test:e2e -- --workers=1 --retries=0 --trace=off
```

Hosted account/race tests require dedicated test credentials and explicitly skip when
unavailable. WebKit on Windows is not native iOS/macOS Safari. See docs/PERFORMANCE_POLISH_AUDIT_2026-10-16.md for
measured Lighthouse outcomes and the remaining performance, accessibility, hosted,
native-device and real-user gates. Do not infer universal correctness from local tests.

## Deploy only after reviewing release gates

Read docs/DATA_AND_DEPLOYMENT.md. Configure SPAROWTYPE_SITE_URL to the actual public
origin before build if generating a sitemap. Deploy dist with included SPA rewrites
and security headers. For a deliberately linked and reviewed staging project, the
operator commands include supabase db push and supabase functions deploy for
submit-session, race-operation and delete-account. No hosted deployment, migration
or publication was executed by packaging this delivery.
'''


def build_packet(entries: list[dict], manifest: dict) -> str:
    research = (ROOT / 'docs/KEYBOARD_AWAKENS_RESEARCH_2026-10-16.md').read_text(encoding='utf-8')
    audit = (ROOT / 'docs/PERFORMANCE_POLISH_AUDIT_2026-10-16.md').read_text(encoding='utf-8') + '\n\n---\n\n## Retained prior product audit\n\n' + (ROOT / 'docs/KEYBOARD_AWAKENS_PRODUCT_AUDIT_2026-10-16.md').read_text(encoding='utf-8')
    tree = '\n'.join(item['path'] for item in entries)
    sections = [
        '# SparowType — complete source, research and audit delivery\n\n'
        'Every included UTF-8 project/source and current-audit file is reproduced in full below. '
        'Binary assets are preserved in SparowType-source.zip; SOURCE_MANIFEST.json lists exact '
        'byte lengths and SHA-256 values. This is local evidence, not a deployment or universal pass.\n',
        '## 1. Findings and Phase 0 research\n\n' + research,
        '## 2. Full folder/file structure\n\n```text\nSparowType/\n' + tree + '\n```\n',
        '## 3. Delivery scope and commands\n\n' + delivery_readme(),
        '## 4. Final audit and remaining gates\n\n' + audit,
        '## 5. Every included readable file in full\n',
    ]
    for entry in entries:
        content = readable(entry['data'])
        if content is None:
            continue
        longest = max((len(match.group()) for match in re.finditer(r'`+', content)), default=0)
        fence = '`' * max(3, longest + 1)
        suffix = PurePosixPath(entry['path']).suffix
        sections.append('### ' + entry['path'] + '\n\n' + fence + LANGUAGES.get(suffix, 'text') + '\n' + content + ('' if content.endswith('\n') else '\n') + fence + '\n')
    binary = [record['path'] for record in manifest['files'] if record['format'] == 'binary']
    sections.append('## 6. Binary assets in the ZIP\n\n```text\n' + '\n'.join(binary) + '\n```\n')
    return '\n'.join(sections)


def main() -> None:
    paths, exclusions = inventory()
    entries = []
    for path in paths:
        relative = path.relative_to(ROOT).as_posix()
        entries.append({'path': relative, 'data': path.read_bytes(), 'category': 'current-audit' if relative.startswith('audit/') else 'project-source'})
    readme = delivery_readme().encode('utf-8')
    if any(item['path'] in {'DELIVERY_README.md', 'SOURCE_MANIFEST.json'} for item in entries):
        raise RuntimeError('Generated delivery filenames collide with existing project files.')
    entries.append({'path': 'DELIVERY_README.md', 'data': readme, 'category': 'delivery-guide'})
    entries.sort(key=lambda item: item['path'])
    security = screen_secrets(entries)
    records = [{'path': item['path'], 'bytes': len(item['data']), 'sha256': hashlib.sha256(item['data']).hexdigest(), 'category': item['category'], 'format': 'utf-8' if readable(item['data']) is not None else 'binary'} for item in entries]
    source_hash = hashlib.sha256(''.join(f"{item['path']}\0{item['sha256']}\n" for item in records if item['category'] == 'project-source').encode()).hexdigest()
    manifest = {
        'createdAtUtc': datetime.now(timezone.utc).isoformat(),
        'snapshot': 'Uncommitted current working tree; no hosted publication or migration.',
        'sourceTreeSha256': source_hash,
        'sourceFiles': sum(item['category'] == 'project-source' for item in records),
        'currentAuditFiles': sum(item['category'] == 'current-audit' for item in records),
        'completeTextFiles': sum(item['format'] == 'utf-8' for item in records),
        'archiveRoot': 'SparowType/', 'manifestSelfHashExcluded': True,
        'secretScreening': security, 'exclusions': exclusions, 'files': records,
    }
    manifest_bytes = (json.dumps(manifest, indent=2) + '\n').encode('utf-8')
    packet = build_packet(entries, manifest).encode('utf-8')
    destination = ROOT / 'delivery'
    if destination.exists() and (is_link(destination) or destination.resolve() != ROOT / 'delivery'):
        raise RuntimeError('Refusing an indirect delivery output directory.')
    destination.mkdir(exist_ok=True)
    outputs = ['SparowType-source.zip', 'SparowType-complete-source.md', 'SparowType-source-manifest.json', 'SparowType-delivery-README.md', 'SparowType-SHA256SUMS.txt']
    with tempfile.TemporaryDirectory(prefix='.package-', dir=destination) as temporary:
        staging = Path(temporary)
        if not staging.resolve().is_relative_to(destination.resolve()):
            raise RuntimeError('Temporary package output escaped the verified delivery directory.')
        (staging / outputs[1]).write_bytes(packet)
        (staging / outputs[2]).write_bytes(manifest_bytes)
        (staging / outputs[3]).write_bytes(readme)
        with zipfile.ZipFile(staging / outputs[0], 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for entry in entries:
                archive.writestr('SparowType/' + entry['path'], entry['data'])
            archive.writestr('SparowType/SOURCE_MANIFEST.json', manifest_bytes)
        with zipfile.ZipFile(staging / outputs[0]) as archive:
            if archive.testzip() is not None:
                raise RuntimeError('Archive CRC verification failed.')
            expected = {'SparowType/' + item['path'] for item in records} | {'SparowType/SOURCE_MANIFEST.json'}
            if set(archive.namelist()) != expected or len(archive.namelist()) != len(expected):
                raise RuntimeError('Archive inventory differs from its manifest.')
            for record in records:
                data = archive.read('SparowType/' + record['path'])
                if len(data) != record['bytes'] or hashlib.sha256(data).hexdigest() != record['sha256']:
                    raise RuntimeError(f"Archive byte/hash mismatch: {record['path']}")
        # Refuse to publish a mixed snapshot if final browser evidence or source
        # changes while the packet is being assembled.
        latest_paths, _ = inventory()
        if [path.relative_to(ROOT).as_posix() for path in latest_paths] != [entry['path'] for entry in entries if entry['category'] != 'delivery-guide']:
            raise RuntimeError('Project inventory changed during packaging; wait for the final evidence freeze.')
        for record in records:
            if record['category'] != 'delivery-guide' and hashlib.sha256((ROOT / record['path']).read_bytes()).hexdigest() != record['sha256']:
                raise RuntimeError(f"Project bytes changed during packaging: {record['path']}")
        checksums = ''.join(f"{hashlib.sha256((staging / name).read_bytes()).hexdigest()}  {name}\n" for name in outputs[:-1])
        (staging / outputs[-1]).write_text(checksums, encoding='utf-8')
        previous = destination / outputs[0]
        preserved = None
        if previous.exists():
            if is_link(previous):
                raise RuntimeError('Refusing an indirect previous delivery archive.')
            previous_hash = hashlib.sha256(previous.read_bytes()).hexdigest()
            if previous_hash != hashlib.sha256((staging / outputs[0]).read_bytes()).hexdigest():
                backup = destination / f'SparowType-source-previous-{previous_hash[:12]}.zip'
                if backup.exists() and (is_link(backup) or hashlib.sha256(backup.read_bytes()).hexdigest() != previous_hash):
                    raise RuntimeError('Previous delivery backup path is indirect or has different bytes.')
                if not backup.exists():
                    shutil.copy2(previous, backup)
                if hashlib.sha256(backup.read_bytes()).hexdigest() != previous_hash:
                    raise RuntimeError('Previous delivery archive backup verification failed.')
                preserved = {'path': backup.relative_to(ROOT).as_posix(), 'sha256': previous_hash}
        for name in outputs:
            (staging / name).replace(destination / name)
    print(json.dumps({'sourceFiles': manifest['sourceFiles'], 'currentAuditFiles': manifest['currentAuditFiles'], 'completeTextFiles': manifest['completeTextFiles'], 'binaryFiles': sum(item['format'] == 'binary' for item in records), 'payloadFiles': len(records), 'zipEntries': len(records) + 1, 'sourceTreeSha256': source_hash, 'secretScreening': security, 'verification': {'zipCRC': True, 'archiveInventory': True, 'everyPayloadByteLengthAndSha256': True, 'sourceUnchangedDuringPackaging': True}, 'preservedPriorArchive': preserved, 'artifacts': [{'path': 'delivery/' + name, 'bytes': (destination / name).stat().st_size, 'sha256': hashlib.sha256((destination / name).read_bytes()).hexdigest()} for name in outputs]}, indent=2))


if __name__ == '__main__':
    main()
