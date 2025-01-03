import pty from "node-pty"

export const ptyProcess = pty.spawn('bash', [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.INIT_CWD,
  env: process.env
});

// ptyProcess.onData((data: string) => {
//   process.stdout.write(data);
// });

// ptyProcess.write('ls\r');
ptyProcess.resize(100, 40);
// ptyProcess.write('ls\r');
