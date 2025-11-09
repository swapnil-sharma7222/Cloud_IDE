import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useSocket } from '../../contexts/SocketContext'; // ✅ Use shared socket

interface TerminalProps {
  containerId: string;
}

export default function TerminalComponent({ containerId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandBufferRef = useRef<string>('');

  const { socket, isConnected } = useSocket(); // ✅ Use shared socket

  useEffect(() => {
    if (!terminalRef.current || !socket || !isConnected) return;

    const xterm = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
      },
      rows: 24,
      cols: 80,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);

    setTimeout(() => {
      fitAddon.fit();
    }, 0);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Initialize terminal when socket is ready
    socket.emit('terminal:init', containerId);

    socket.on('terminal:data', (data: string) => {
      xterm.write(data);
    });

    xterm.onData((data: string) => {
      const code = data.charCodeAt(0);

      if (code === 13) {
        const command = commandBufferRef.current;
        commandBufferRef.current = '';

        if (command.trim()) {
          socket.emit('terminal:exec', command);
        } else {
          xterm.write('\r\n$ ');
        }
        return;
      }

      if (code === 127 || code === 8) {
        if (commandBufferRef.current.length > 0) {
          commandBufferRef.current = commandBufferRef.current.slice(0, -1);
          xterm.write('\b \b');
        }
        return;
      }

      if (code === 3) {
        commandBufferRef.current = '';
        xterm.write('^C\r\n$ ');
        return;
      }

      if (code >= 32 && code < 127) {
        commandBufferRef.current += data;
        xterm.write(data);
      }
    });

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      // ✅ Remove socket listeners but don't disconnect
      socket.off('terminal:data');
      xterm.dispose();
    };
  }, [socket, isConnected, containerId]);

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1e1e1e',
      }}
    />
  );
}