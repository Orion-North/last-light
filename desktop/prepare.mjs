import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const desktop = fileURLToPath(new URL('.', import.meta.url));
const root = path.resolve(desktop, '..');
const stage = path.join(desktop, 'stage');
await rm(stage, { recursive: true, force: true });
await mkdir(path.join(stage, 'game'), { recursive: true });
for (const entry of ['index.html', 'src', 'public', 'vendor']) {
  await cp(path.join(root, entry), path.join(stage, 'game', entry), {
    recursive: true, filter: file => !file.endsWith('.gitkeep'),
  });
}
for (const entry of ['main.js', 'policy.js', 'preload.cjs']) await cp(path.join(desktop, entry), path.join(stage, entry));
const pkg = JSON.parse(await readFile(path.join(desktop, 'package.json'), 'utf8'));
await writeFile(path.join(stage, 'package.json'), JSON.stringify({
  name: 'last-light', productName: 'Last Light', version: pkg.version,
  private: true, type: 'module', main: 'main.js', description: pkg.description,
}, null, 2) + '\n');
// Keep source attribution and third-party notices inside the distributable.
await cp(path.join(root, 'README.md'), path.join(stage, 'README.md'));
await cp(path.join(root, 'docs', 'WINDOWS.md'), path.join(stage, 'WINDOWS.md'));
console.log('Bundled game and all assets into desktop/stage (no remote game host).');
