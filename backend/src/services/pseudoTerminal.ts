import { IPty, spawn } from 'node-pty-prebuilt-multiarch'
import * as os from 'os'
import { Socket } from 'socket.io'

export function createTerminalManager() {
  const PROJECT_PATH = 'D:\\work\\cloud ide\\backend'
  const SHELL = os.platform() === 'win32' ? 'powershell.exe' : 'bash'

  // add scrollback to session record
  const sessions: {
    [id: string]: { terminal: IPty; socket: Socket; scrollback: string }
  } = {}
  let runPty: IPty | null = null
  let runScrollback = ''

  function createPty(
    socket: Socket,
    onData: (data: string, id: number) => void
  ): IPty {
    const term = spawn(SHELL, [], {
      cols: 300,
      name: 'xterm',
      cwd: PROJECT_PATH,
      env: process.env as any,
    })

    // initialize scrollback for this session
    sessions[socket.id] = { terminal: term, socket, scrollback: '' }

    term.onData((data: string) => {
      // append to per-session scrollback (keep capped length)
      const sess = sessions[socket.id]
      if (sess) {
        sess.scrollback += data
        if (sess.scrollback.length > 100_000) {
          sess.scrollback = sess.scrollback.slice(-100_000)
        }
      }
      onData(data, term.pid)
    })

    term.onExit(() => {
      delete sessions[socket.id]
    })

    return term
  }

  // simple write (keeps existing behavior)
  function write(socketId: string, data: string) {
    sessions[socketId]?.terminal.write(data)
  }

  // ---- new: write and capture output produced AFTER this write ----
  type CaptureOpts = { timeout?: number; waitFor?: RegExp }
  function writeAndCapture(
    socketId: string,
    data: string,
    opts: CaptureOpts = {}
  ): Promise<string> {
    const sess = sessions[socketId]
    if (!sess) return Promise.reject(new Error('Session not found'))

    const startLen = sess.scrollback.length
    const timeout = opts.timeout ?? 500 // default 500ms
    const waitFor = opts.waitFor

    return new Promise((resolve) => {
      let resolved = false

      // helper to resolve once condition met
      const tryResolve = () => {
        if (resolved) return
        const newData = sess.scrollback.slice(startLen)
        if (waitFor) {
          if (waitFor.test(newData)) {
            resolved = true
            clearTimers()
            resolve(newData)
          }
        }
      }

      // timers
      const timer = setTimeout(() => {
        if (resolved) return
        resolved = true
        resolve(sess.scrollback.slice(startLen))
      }, timeout)

      // If a waitFor is provided, poll quickly to check if it matches
      // (We could alternatively hook into onData events — using polling is simple and safe)
      const pollInterval = waitFor ? setInterval(tryResolve, 50) : null

      function clearTimers() {
        clearTimeout(timer)
        if (pollInterval) clearInterval(pollInterval)
      }

      // write to terminal (append newline if needed)
      sess.terminal.write(data)
      // if no waitFor then we'll resolve on timeout, but attempt one immediate check
      if (!waitFor) {
        // nothing — promise will resolve on timeout
      } else {
        // immediate check in case output is synchronous
        tryResolve()
      }
    })
  }

  function clearSessionScrollback(socketId: string) {
    if (sessions[socketId]) sessions[socketId].scrollback = ''
  }

  function getSessionScrollback(socketId: string) {
    return sessions[socketId]?.scrollback ?? ''
  }

  function clear(socketId: string) {
    sessions[socketId]?.terminal.kill()
    delete sessions[socketId]
  }

  function run(cmd: string, onData: (data: string, id: number) => void) {
    // Kill existing run PTY
    runPty?.kill()
    runScrollback = ''

    runPty = spawn(SHELL, [], {
      cols: 300,
      name: 'xterm',
      cwd: PROJECT_PATH,
      env: process.env as any,
    })

    runPty.write(cmd + '\r')

    runPty.onData((data: string) => {
      runScrollback += data
      if (runScrollback.length > 100_000) {
        runScrollback = runScrollback.slice(-100_000)
      }
      onData(data, runPty!.pid)
    })

    runPty.onExit(() => {
      runPty = null
      runScrollback = ''
    })
  }

  function stopProcess() {
    runPty?.kill()
    runPty = null
  }

  function isRunning(): boolean {
    return runPty !== null
  }

  function getRunScrollback(): string {
    return runScrollback
  }

  return {
    createPty,
    write,
    writeAndCapture, // new
    clear,
    clearSessionScrollback,
    getSessionScrollback,
    run,
    stopProcess,
    isRunning,
    getRunScrollback,
  }
}

// import pty from "node-pty"
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// export const ptyProcess = pty.spawn('bash', [], {
//   name: 'xterm-color',
//   cols: 80,
//   rows: 30,
//   cwd: path.join(__dirname, '../..'), // Navigate two levels up
//   env: process.env,
// });


// ptyProcess.onData((data: string) => {
//   process.stdout.write(data);
// });

// ptyProcess.write('ls\r');
// ptyProcess.resize(100, 40);
// // ptyProcess.write('ls\r');