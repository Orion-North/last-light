import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const desktop = fileURLToPath(new URL('.', import.meta.url));
const executable = path.join(desktop, 'release', 'LastLight-win32-x64', 'LastLight.exe');
const child = spawn(executable, ['--smoke-test'], { stdio: 'inherit', windowsHide: true });
const timeout = setTimeout(() => { child.kill(); process.exitCode = 1; }, 45000);
child.on('error', error => { clearTimeout(timeout); console.error(error); process.exitCode = 1; });
child.on('exit', code => { clearTimeout(timeout); process.exitCode = code === 0 ? 0 : 1; });
