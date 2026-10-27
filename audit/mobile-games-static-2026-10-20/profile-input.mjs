import { readFile, writeFile, mkdir } from 'node:fs/promises';
const directory = 'audit/mobile-games-static-2026-10-20';
await mkdir(directory, { recursive: true });
let source = await readFile('audit/correction-experience-2026-10-20/measure-typing.mjs', 'utf8');
source = source.replace("const directory = 'audit/correction-experience-2026-10-20';", `const directory = '${directory}';`);
source = source.replace("  let resize = null;", `  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.start');
  let resize = null;`);
source = source.replace("  const observation = await page.evaluate(() => window.typingBench);", `  const { profile } = await cdp.send('Profiler.stop');
  await writeFile(directory + '/input-before.cpuprofile', JSON.stringify(profile));
  const byFunction = new Map();
  for (const node of profile.nodes) {
    const name = node.callFrame.functionName || '(anonymous)';
    const key = name + ' ' + node.callFrame.url + ':' + node.callFrame.lineNumber + ':' + node.callFrame.columnNumber;
    byFunction.set(key, (byFunction.get(key) || 0) + (node.hitCount || 0));
  }
  console.log(JSON.stringify({ sampledFunctions: [...byFunction].sort((a,b) => b[1]-a[1]).slice(0,35) }, null, 2));
  const observation = await page.evaluate(() => window.typingBench);`);
await writeFile(`${directory}/.profile-input.generated.mjs`, source);
await import(`./.profile-input.generated.mjs`);
