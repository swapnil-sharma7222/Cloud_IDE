import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

const TerminalFrontend: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const term = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    if (terminalRef.current) {
      // Initialize terminal
      term.current = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        theme: {
          background: '#1e1e1e',
          foreground: '#ffffff',
        },
      });

      // Add FitAddon for responsive resizing
      fitAddon.current = new FitAddon();
      term.current.loadAddon(fitAddon.current);

      // Add WebLinksAddon for clickable links
      const webLinksAddon = new WebLinksAddon();
      term.current.loadAddon(webLinksAddon);

      // Open the terminal in the div
      term.current.open(terminalRef.current);

      // Fit the terminal to its container
      fitAddon.current.fit();

      // Initialize Socket.IO connection
      socket.current = io('ws://localhost:8081/');

      socket.current.on('connect', () => {
        console.log('Connected to Socket.IO server');
      });

      socket.current.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
      });

      // Handle user input
      term.current.onData((data) => {
        socket.current?.emit('terminal:write', data);
      });

      // Handle data from backend
      socket.current.on('terminal:data', (data: string) => {
        term.current?.write(data);
      });

      // Clean up on component unmount
      return () => {
        term.current?.dispose();
        fitAddon.current?.dispose();
        socket.current?.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    // Adjust terminal size on window resize
    const handleResize = () => {
      fitAddon.current?.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: 'inherit',
        backgroundColor: '#1e1e1e',
        overflowX: 'clip',
      }}
    ></div>
  );
};

export default TerminalFrontend;
