import React, { useState, MouseEvent } from "react";
import "./dashboard.css";
import { CodeEditor } from "../../components/code-editor";
import TerminalComponent from "../../components/terminal";

interface ColumnWidths {
  column1: number;
  column2: number;
  column3: number;
}

const Dashboard: React.FC = () => {
  // Initialize state for each column's width (in percentage) and the terminal's height.
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    column1: 16,
    column2: 51,
    column3: 33,
  });
  const [terminalHeight, setTerminalHeight] = useState<number>(100); // Initial height of the terminal
  const [terminalWidth, setTerminalWidth] = useState<number>(
    100 - columnWidths.column1
  );

  // Handle the drag for the vertical resizer (between column 1 and column 2)
  const handleDragFirstResizer = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth1 = columnWidths.column1;
    const startWidth2 = columnWidths.column2;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (delta / containerWidth) * 100;

      setColumnWidths((prevWidths) => {
        const newWidth1 = Math.max(0, startWidth1 + deltaPercent);
        const newWidth2 = Math.max(0, startWidth2 - deltaPercent);
        setTerminalWidth(100 - newWidth1);
        return { ...prevWidths, column1: newWidth1, column2: newWidth2 };
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove as any);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove as any);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle the drag for the vertical resizer (between column 2 and column 3)
  const handleDragSecondResizer = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth2 = columnWidths.column2;
    const startWidth3 = columnWidths.column3;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (delta / containerWidth) * 100;

      setColumnWidths((prevWidths) => {
        const newWidth2 = Math.max(0, startWidth2 + deltaPercent);
        const newWidth3 = Math.max(0, startWidth3 - deltaPercent);
        return { ...prevWidths, column2: newWidth2, column3: newWidth3 };
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove as any);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove as any);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle the drag for the horizontal resizer above the terminal div
  const handleHorizontalResizer = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = terminalHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      const newHeight = Math.max(0, startHeight - delta); // Minimum terminal height is 0px

      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove as any);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove as any);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="dashboard-container-wrapper">
      <div className="dashboard-container">
        {/* Navbar */}
        <div className="navbar-wrapper" style={{ border: "1px solid black" }}>
          <div className="nav">this is navbar</div>
        </div>
        <div className="hero-wrapper">
          {/* Column 1 */}
          <div
            className="column"
            style={{ width: `${columnWidths.column1}%` }}
          >
            Column 1
          </div>

          {/* Resizer between Column 1 and Column 2 */}
          <div className="resizer" onMouseDown={handleDragFirstResizer}></div>

          {/* Column 2 */}
          <div
            className="column"
            style={{ width: `${columnWidths.column2}%` }}
          >
            <CodeEditor/>
          </div>

          {/* Resizer between Column 2 and Column 3 */}
          <div className="resizer" onMouseDown={handleDragSecondResizer}></div>

          {/* Column 3 */}
          <div
            className="column"
            style={{ width: `${columnWidths.column3}%` }}
          >
            Column 3
          </div>

          <div className="terminal-wrapper">
            {/* Resizer above the terminal for resizing its height */}
            <div
              className="horizontal-resizer"
              onMouseDown={handleHorizontalResizer}
              style={{
                left: `${columnWidths.column1}%`, // Matches the width of column 1
                width: `${terminalWidth}%`,
                bottom: `${terminalHeight}px`,
              }}
            ></div>

            {/* Terminal div that overlaps columns 2 and 3 */}
            <div
              className="terminal"
              style={{
                height: `${terminalHeight}px`,
                left: `${columnWidths.column1}%`, // Matches the width of column 1
                width: `${terminalWidth}%`,
              }}
            >
              <TerminalComponent/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
