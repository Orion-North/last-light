import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const item of ['index.html', 'src', 'public', 'vendor']) {
  await cp(path.join(root, item), path.join(dist, item), {
    recursive: true, filter: (src) => !src.endsWith('.gitkeep') && !src.endsWith('.md') && !src.endsWith('.csv'),
  });
}
console.log(`Static build written to ${dist}`);
console.log(`Landscape: ${((await stat(path.join(dist, 'public/images/mars-landscape.png'))).size / 1024 / 1024).toFixed(2)} MB`);
