// import React, { useEffect, useRef, useState } from "react";
// import { Terminal } from "@xterm/xterm";
// import { WebLinksAddon } from "@xterm/addon-web-links";
// import { FitAddon } from "@xterm/addon-fit";
// import { io, Socket } from "socket.io-client";
// import "@xterm/xterm/css/xterm.css";

// const TerminalFrontend: React.FC = () => {
//   const terminalRef = useRef<HTMLDivElement | null>(null);
//   const term = useRef<Terminal | null>(null);
//   const fitAddon = useRef<FitAddon | null>(null);
//   const socket = useRef<Socket | null>(null);
//   const [inputBuffer, setInputBuffer] = useState<string>("ls");

//   useEffect(() => {
//     if (terminalRef.current) {
//       // Initialize terminal
//       term.current = new Terminal({
//         cursorBlink: true,
//         fontSize: 14,
//         theme: {
//           background: "#1e1e1e",
//           foreground: "#ffffff",
//         },
//       });

//       // Add FitAddon for responsive resizing
//       fitAddon.current = new FitAddon();
//       term.current.loadAddon(fitAddon.current);

//       // Add WebLinksAddon for clickable links
//       const webLinksAddon = new WebLinksAddon();
//       term.current.loadAddon(webLinksAddon);

//       // Open the terminal in the div
//       term.current.open(terminalRef.current);

//       // Fit the terminal to its container
//       fitAddon.current.fit();

//       // Initialize Socket.IO connection
//       socket.current = io("ws://localhost:8080/");

//       socket.current.on("connection", () => {
//         console.log("Connected to Socket.IO server");
//       });

//       socket.current.on("disconnect", () => {
//         console.log("Disconnected from Socket.IO server");
//       });

//       // Handle user input
//       term.current.onData((data) => {
//         console.log("this is input buffer",inputBuffer);
//         // Display the user's input in the terminal
//         term.current?.write(data);

//         // If Enter key is pressed, send the input to the backend
//         if (data === "\r") {
//           socket.current?.emit("terminal:write", inputBuffer);
//           setInputBuffer(''); // Clear the buffer
//         } else if (data === "\u007F") {
//           // Handle backspace
//           term.current?.write("\b \b"); // Erase character from terminal
//           if (inputBuffer.length > 0) {
//             setInputBuffer((prev) => prev.slice(0, -1));
//           }
//         } else {
//           // Append character to buffer
//           console.log("this is data",data);
//           setInputBuffer((prev:string):string => {
//             return prev+ data;
//           });
//         }
//       });

//       // Handle data from backend
//       socket.current.on("terminal:data", (data: string) => {
//         term.current?.write(data);
//       });

//       // Clean up on component unmount
//       return () => {
//         term.current?.dispose();
//         fitAddon.current?.dispose();
//         socket.current?.disconnect();
//       };
//     }
//   }, []);

//   useEffect(() => {
//     // Adjust terminal size on window resize
//     const handleResize = () => {
//       fitAddon.current?.fit();
//     };
//     window.addEventListener("resize", handleResize);

//     return () => {
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   return (
//     <div
//       ref={terminalRef}
//       style={{
//         width: "100%",
//         height: "inherit",
//         backgroundColor: "red",
//         overflowX: "clip",
//       }}
//     ></div>
//   );
// };

// export default TerminalFrontend;

import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { io, Socket } from "socket.io-client";
import "@xterm/xterm/css/xterm.css";

const TerminalFrontend: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const term = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const socket = useRef<Socket | null>(null);
  const inputBuffer = useRef<string>(""); // Using useRef for the input buffer

  useEffect(() => {
    if (terminalRef.current) {
      // Initialize terminal
      term.current = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        theme: {
          background: "#1e1e1e",
          foreground: "#ffffff",
        },
      });

      // Initialize and load addons
      fitAddon.current = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      term.current.loadAddon(fitAddon.current);
      term.current.loadAddon(webLinksAddon);

      // Open the terminal in the div
      term.current.open(terminalRef.current);

      // Fit the terminal to its container
      fitAddon.current.fit();

      // Initialize Socket.IO connection
      socket.current = io("ws://localhost:8080/");

      socket.current.on("connect", () => {
        console.log("Connected to Socket.IO server");
      });

      socket.current.on("disconnect", () => {
        console.log("Disconnected from Socket.IO server");
      });

      // Handle incoming data from backend
      socket.current.on("terminal:data", (data: string) => {
        term.current?.write(data);
      });
      // socket.current.on('terminal:data', (data: string): void => {
      //   console.log(`Received command: ${data}`);
      //   term.current?.write(`${data}\n`);
      // });

      // Handle user input
      term.current.onData((data) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          // Enter key
          term.current?.write("\r\n");
          socket.current?.emit("terminal:write", inputBuffer.current + "\n");
          inputBuffer.current = ""; // Clear the buffer
        } else if (code === 127) {
          // Backspace key
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            term.current?.write("\b \b");
          }
        } else {
          inputBuffer.current += data;
          term.current?.write(data);
        }
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
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "red",
        overflowY: "hidden",
      }}
    ></div>
  );
};

export default TerminalFrontend;
