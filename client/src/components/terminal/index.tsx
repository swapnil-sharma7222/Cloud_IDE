import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useSocket } from '../../contexts/SocketContext';

interface TerminalProps {
  containerId: string;
}

export default function TerminalComponent({ containerId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandBufferRef = useRef<string>('');
  
  // ✅ Store command history
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const { socket, isConnected } = useSocket();

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

    socket.emit('terminal:init', containerId);

    socket.on('terminal:data', (data: string) => {
      xterm.write(data);
    });

    xterm.onData((data: string) => {
      const code = data.charCodeAt(0);

      
      if (data === '\x1b[A') {
        // Arrow Up 
        if (commandHistoryRef.current.length === 0) return;

        if (historyIndexRef.current === -1) {
          historyIndexRef.current = commandHistoryRef.current.length - 1;
        } else if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
        }

        const historicCommand = commandHistoryRef.current[historyIndexRef.current];
        clearCurrentLine(xterm, commandBufferRef.current.length);
        commandBufferRef.current = historicCommand;
        xterm.write(historicCommand);
        return;
      }

      if (data === '\x1b[B') {
        // Arrow Down 
        if (commandHistoryRef.current.length === 0 || historyIndexRef.current === -1) return;

        if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
          historyIndexRef.current++;
          const historicCommand = commandHistoryRef.current[historyIndexRef.current];
          clearCurrentLine(xterm, commandBufferRef.current.length);
          commandBufferRef.current = historicCommand;
          xterm.write(historicCommand);
        } else {
          historyIndexRef.current = -1;
          clearCurrentLine(xterm, commandBufferRef.current.length);
          commandBufferRef.current = '';
        }
        return;
      }

      // Enter key - Execute command
      if (code === 13) {
        const command = commandBufferRef.current.trim();
        
        if (command) {
          if (
            commandHistoryRef.current.length === 0 ||
            commandHistoryRef.current[commandHistoryRef.current.length - 1] !== command
          ) {
            console.log('Adding command to history:', command);
            commandHistoryRef.current.push(command);
          }
          
          historyIndexRef.current = -1;
          
          socket.emit('terminal:exec', command);
        } else {
          xterm.write('\r\n$ ');
        }
        
        commandBufferRef.current = '';
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
        historyIndexRef.current = -1;
        xterm.write('^C\r\n$ ');
        return;
      }

      // Regular character input
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

// ✅ Helper function to clear current line
function clearCurrentLine(xterm: Terminal, length: number) {
  // Move cursor back to start of input
  for (let i = 0; i < length; i++) {
    xterm.write('\b');
  }
  // Clear characters
  for (let i = 0; i < length; i++) {
    xterm.write(' ');
  }
  // Move cursor back again
  for (let i = 0; i < length; i++) {
    xterm.write('\b');
  }
}