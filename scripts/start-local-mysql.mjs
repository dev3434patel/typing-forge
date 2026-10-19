import { spawn, spawnSync } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

// This helper is specific to the already initialized local Windows instance.
// It never initializes, repairs, deletes or grants access to any database.
const root = path.resolve(import.meta.dirname, '..');
const directory = path.join(root, 'backend/storage/mysql');
const defaults = path.join(directory, 'my.ini');
const binary = 'C:/xampp/mysql/bin/mysqld.exe';
const markerFile = path.join(directory, '.sparowtype-local-mysql.json');
const port = 3308;
const normalized = value => path.resolve(value).replaceAll('\\', '/').toLowerCase();

function powershell(script) {
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8', windowsHide: true,
  });
  if (result.error || result.status !== 0) throw new Error('Could not inspect local process ownership. No database process was started.');
  const output = result.stdout.trim();
  return output ? JSON.parse(output) : null;
}

function ownsProcess(process) {
  if (!process?.ExecutablePath || normalized(process.ExecutablePath) !== normalized(binary)) return false;
  const args = [...String(process.CommandLine || '').matchAll(/"([^"]*)"|([^\s"]+)/g)].map(match => match[1] ?? match[2]);
  if (![5, 6].includes(args.length) || normalized(args[0]) !== normalized(binary)) return false;
  const option = args.find(value => value.startsWith('--defaults-file='));
  const dataOption = args.find(value => value.startsWith('--datadir='));
  const allowed = args.slice(1).every(value => value === option || value === dataOption ||
    ['--bind-address=127.0.0.1', `--port=${port}`, '--console'].includes(value));
  return allowed && (!dataOption || normalized(dataOption.slice('--datadir='.length)) === normalized(directory)) &&
    option && normalized(option.slice('--defaults-file='.length)) === normalized(defaults) &&
    args.includes('--bind-address=127.0.0.1') && args.includes(`--port=${port}`) && args.includes('--console');
}

try {
  if (process.platform !== 'win32') throw new Error('This prepared-instance helper is Windows/XAMPP specific. Use the database service configured for your own machine.');
  if (process.argv.slice(2).some(argument => argument !== '--check')) throw new Error('Only the optional --check argument is supported.');
  let marker;
  try { marker = JSON.parse(await readFile(markerFile, 'utf8')); }
  catch { throw new Error('The prepared local database marker is missing or unreadable. Start your healthy XAMPP instance and follow docs/PHP_XAMPP_SETUP.md; this helper will not initialize a database.'); }
  if (marker.app !== 'SparowType' || marker.format !== 1 || marker.port !== port ||
      typeof marker.directory !== 'string' || normalized(marker.directory) !== normalized(directory) ||
      typeof marker.binary !== 'string' || normalized(marker.binary) !== normalized(binary)) {
    throw new Error('The local database marker does not match this exact workspace instance. No process was started.');
  }
  if (normalized(await realpath(directory)) !== normalized(directory) || normalized(await realpath(binary)) !== normalized(binary)) {
    throw new Error('The prepared data directory or executable resolves to an unexpected location.');
  }
  const ini = await readFile(defaults, 'utf8');
  const sections = Object.create(null);
  let section = '';
  for (const line of ini.split(/\r?\n/)) {
    const header = line.trim().match(/^\[([^\]]+)\]$/);
    if (header) { section = header[1].toLowerCase(); sections[section] ??= Object.create(null); continue; }
    const entry = line.match(/^\s*([A-Za-z_-]+)\s*=\s*(.*?)\s*$/);
    if (entry && section) sections[section][entry[1].toLowerCase()] = entry[2].replace(/^"|"$/g, '');
  }
  if (!sections.mysqld?.datadir || normalized(sections.mysqld.datadir) !== normalized(directory)) throw new Error('my.ini must point to the exact prepared workspace data directory.');
  // Initialization and table markers must already exist. Do not launch against
  // an empty folder that happens to contain a handwritten marker or config.
  await Promise.all(['ibdata1', 'mysql/global_priv.frm'].map(file => realpath(path.join(directory, file))));
  const listeners = powershell(`$rows=@(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); $output=@(foreach($idValue in $rows){Get-CimInstance Win32_Process -Filter "ProcessId = $idValue" | Select-Object ProcessId,ExecutablePath,CommandLine}); ConvertTo-Json -InputObject $output -Compress`);
  if (listeners?.length) {
    if (listeners.length !== 1 || !ownsProcess(listeners[0])) throw new Error(`Port ${port} belongs to another or unverifiable process. It was left untouched; no database process was started.`);
    console.log(`SparowType local MariaDB is already running on 127.0.0.1:${port} (PID ${listeners[0].ProcessId}).`);
  } else if (process.argv.includes('--check')) {
    console.log(`SparowType's prepared local database is stopped. Run npm run backend:db to start port ${port}.`);
  } else {
    console.log(`Starting only SparowType's prepared MariaDB on 127.0.0.1:${port}. Leave this terminal open.`);
    const child = spawn(binary, [`--defaults-file=${defaults}`, `--datadir=${directory}`, '--bind-address=127.0.0.1', `--port=${port}`, '--console'], {
      cwd: directory, stdio: 'inherit', windowsHide: true,
    });
    child.once('error', error => { console.error(`The local database could not start: ${error.message}`); process.exitCode = 1; });
    child.once('exit', code => { process.exitCode = code ?? 1; });
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'The local database could not be inspected.');
  process.exitCode = 1;
}
