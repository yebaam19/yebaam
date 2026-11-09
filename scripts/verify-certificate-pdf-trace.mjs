import assert from 'node:assert/strict';
import { readFile, readdir, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

// Run after pnpm build: verify the deployment artifact, not just the config.
const require = createRequire(import.meta.url);
const chromiumRoot = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '../..');
const binaryDirectory = path.join(chromiumRoot, 'bin');
const tracePath = path.resolve('.next/server/app/api/verification/certificate/[code]/pdf/route.js.nft.json');
const trace = JSON.parse(await readFile(tracePath, 'utf8'));
const tracedFiles = new Set(await Promise.all(trace.files.map(async (file) => {
  const absolutePath = path.resolve(path.dirname(tracePath), file);
  return realpath(absolutePath).catch(() => absolutePath);
})));
const archives = (await readdir(binaryDirectory)).filter((name) => name.endsWith('.br'));
assert(archives.includes('chromium.br'), 'Installed Chromium binary archive is missing');
for (const archive of archives) {
  const binaryPath = await realpath(path.join(binaryDirectory, archive));
  assert(tracedFiles.has(binaryPath), `Certificate PDF function omits Chromium asset: ${archive}`);
}
console.log(`Certificate PDF trace includes all ${archives.length} Chromium archives.`);
