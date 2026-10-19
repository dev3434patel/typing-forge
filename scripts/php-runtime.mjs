import { existsSync } from 'node:fs';
import path from 'node:path';

export function phpRuntime() {
  const binary = process.env.PHP_BINARY || (existsSync('C:/xampp/php/php.exe') ? 'C:/xampp/php/php.exe' : 'php');
  const xampp = binary.replaceAll('\\', '/').toLowerCase().includes('/xampp/php/');
  const args = xampp ? ['-n', '-d', `extension_dir=${path.dirname(binary)}/ext`, '-d', 'extension=intl', '-d', 'extension=mbstring', '-d', 'extension=pdo_mysql'] : [];
  return { binary, args };
}
