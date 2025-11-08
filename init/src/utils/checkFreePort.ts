import net from "net";

/**
 * Checks if a specific TCP port is available.
 * @param port - The port number to check.
 * @returns Promise that resolves to true if free, false if occupied.
 */
function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.once("connect", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ECONNREFUSED" || err.code === "EHOSTUNREACH") {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    socket.setTimeout(100);
    socket.connect(port, "127.0.0.1");
  });
}

/**
 * Finds the first available port in a given range using parallel checks.
 * @param startPort - Port number to start checking from.
 * @param endPort - Port number to end checking.
 * @param concurrency - Number of ports to check in parallel (default: 50).
 * @returns Promise resolving to the first free port number.
 */
export async function findFreePort(
  startPort = 4000,
  endPort = 4100,
  concurrency = 50
): Promise<number> {
  const ports = Array.from({ length: endPort - startPort + 1 }, (_, i) => startPort + i);

  // Split into chunks for parallel checks
  const chunks: number[][] = [];
  for (let i = 0; i < ports.length; i += concurrency) {
    chunks.push(ports.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const results = await Promise.all(chunk.map((port) => isPortFree(port)));
    const freeIndex = results.findIndex((r) => r);
    if (freeIndex !== -1) {
      return chunk[freeIndex];
    }
  }

  throw new Error(`No free ports found between ${startPort} and ${endPort}`);
}
