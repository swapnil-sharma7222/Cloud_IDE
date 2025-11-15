import { Terminal } from '@xterm/xterm';
export function clearCurrentLine(xterm: Terminal, length: number) {
  for (let i = 0; i < length; i++) {
    xterm.write('\b');
  }
  for (let i = 0; i < length; i++) {
    xterm.write(' ');
  }
  for (let i = 0; i < length; i++) {
    xterm.write('\b');
  }
}