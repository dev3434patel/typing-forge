import { spawn } from 'node:child_process';
import { phpRuntime } from './php-runtime.mjs';

const { binary, args } = phpRuntime();
const port = process.env.SPAROWTYPE_PHP_PORT || '8081';
if (!/^\d{2,5}$/.test(port) || Number(port) > 65535) throw new Error('Invalid SPAROWTYPE_PHP_PORT.');
const server = spawn(binary, [...args, '-S', `127.0.0.1:${port}`, '-t', 'backend/public', 'backend/router.php'], { stdio: 'inherit' });
server.on('error', error => { console.error(`PHP could not start: ${error.message}. Install PHP 8.2+ or set PHP_BINARY.`); process.exitCode = 1; });
server.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
