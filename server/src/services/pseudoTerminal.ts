import pty from "node-pty"
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ptyProcess = pty.spawn('bash', [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: path.join(__dirname, '../..'), // Navigate two levels up
  env: process.env,
});


// ptyProcess.onData((data: string) => {
//   process.stdout.write(data);
// });

// ptyProcess.write('ls\r');
ptyProcess.resize(100, 40);
// ptyProcess.write('ls\r');
