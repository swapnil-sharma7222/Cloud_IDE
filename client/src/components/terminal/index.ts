import { Terminal } from '@xterm/xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import React, { useEffect, useRef } from 'react';
import 'xterm/css/xterm.css';

const TerminalComponent: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const term = useRef<Terminal | null>(null);

  useEffect(() => {
    if (terminalRef.current) {
      term.current = new Terminal();
      const webLinksAddon = new WebLinksAddon();
      term.current.loadAddon(webLinksAddon);
      term.current.open(terminalRef.current);
    }
  }, []);

  return (
    <h1></h1>
  );
};

export default TerminalComponent;
