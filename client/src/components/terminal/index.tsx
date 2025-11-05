import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { io, Socket } from 'socket.io-client';

interface TerminalProps {
  containerId: string;
}

export default function TerminalComponent({ containerId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandBufferRef = useRef<string>('');

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
      },
      rows: 24, // ✅ Set initial rows
      cols: 80, // ✅ Set initial columns
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);
    
    // ✅ Delay fit to ensure container is rendered
    setTimeout(() => {
      fitAddon.fit();
    }, 0);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    const socket = io('http://localhost:4200');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to terminal server');
      socket.emit('terminal:init', containerId);
    });

    socket.on('terminal:data', (data: string) => {
      xterm.write(data);
    });

    // Handle user input
    xterm.onData((data: string) => {
      const code = data.charCodeAt(0);

      // Enter key
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

      // Backspace
      if (code === 127 || code === 8) {
        if (commandBufferRef.current.length > 0) {
          commandBufferRef.current = commandBufferRef.current.slice(0, -1);
          xterm.write('\b \b');
        }
        return;
      }

      // Ctrl+C
      if (code === 3) {
        commandBufferRef.current = '';
        xterm.write('^C\r\n$ ');
        return;
      }

      // Regular character
      if (code >= 32 && code < 127) {
        commandBufferRef.current += data;
        xterm.write(data);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from terminal server');
    });

    // ✅ Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // ✅ Also fit when container size changes
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
      socket.disconnect();
      xterm.dispose();
    };
  }, [containerId]);

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '100%', // ✅ Changed to 100%
        backgroundColor: '#1e1e1e',
      }}
    />
  );
}