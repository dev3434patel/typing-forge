import { copyFile, constants, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const checkpoint = process.argv[2];
if (!/^after[1-9][0-9]*$/.test(checkpoint || '')) throw new Error('Choose an explicit afterN checkpoint.');
const root = path.resolve('audit/mobile-games-static-2026-10-20');
const names = [
  'static-browser-final.json', 'static-browser-final.log',
  'static-game-axe-final.json', 'static-game-axe-final.log',
  'static-verification-summary.json', 'static-artifacts.json',
  'static-vercel-release-build.log', 'static-pages-release-build.log',
  'static-vercel-games-ready-1440.png', 'static-vercel-games-playing-390.png',
  'static-github-pages-games-ready-1440.png', 'static-github-pages-games-playing-390.png',
];
const receipt = [];
for (const name of names) {
  const source = path.join(root, name);
  const destinationName = name.replace(/^static-/, `static-${checkpoint}-`);
  const destination = path.join(root, destinationName);
  const bytes = await readFile(source);
  try { await copyFile(source, destination, constants.COPYFILE_EXCL); }
  catch (error) {
    if (error.code !== 'EEXIST' || !bytes.equals(await readFile(destination))) throw error;
  }
  receipt.push({ source: name, preserved: destinationName, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
for (const target of ['vercel', 'pages']) for (const name of ['offline-build.json', 'deployment.json']) {
  const bytes = await readFile(`dist-static-${target}/${name}`);
  const destinationName = `static-${checkpoint}-${target}-${name}`;
  try { await writeFile(path.join(root, destinationName), bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST' || !bytes.equals(await readFile(path.join(root, destinationName)))) throw error;
  }
  receipt.push({ source: `dist-static-${target}/${name}`, preserved: destinationName, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile(path.join(root, `static-${checkpoint}-preservation.json`), JSON.stringify({ recordedAt: new Date().toISOString(), checkpoint, receipt, rawBrowserArtifacts: 'Existing static-final-artifacts and static-game-axe-final-artifacts directories are retained; the next release must use new output directories.' }, null, 2) + '\n');
console.log(JSON.stringify({ checkpoint, filesPreserved: receipt.length }));
