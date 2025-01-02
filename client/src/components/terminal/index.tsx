import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const TerminalFrontend: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const term = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

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

      // Example of writing output to the terminal
      term.current.writeln('Welcome to the Terminal!');
      term.current.writeln('Type something and press Enter...');
      term.current.writeln('Clickable link: https://github.com');

      // Handle user input
      term.current.onData((data) => {
        // Simulate echo
        term.current?.writeln(`You typed: ${data}`);
      });

      // Clean up on component unmount
      return () => {
        term.current?.dispose();
        fitAddon.current?.dispose();
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
      style={{ width: '100%', height: 'inherit', backgroundColor: '#ffffff', overflowX: 'clip', 
      }}
    ></div>
  );
};

export default TerminalFrontend;
