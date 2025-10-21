// CODE EDITOR WITH REDUX INTEGRATION
import { useMonaco } from "@monaco-editor/react";
import { Editor } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import FileTabs from "./FileTabs";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { markFileSaved, updateFileCode } from "../../features/FileTabs/fileTabSlice";

type Props = {
  theme?: string;
};

export function CodeEditor({ theme }: Props) {
  const monaco = useMonaco();
  const dispatch = useDispatch();

  const activeTabPath = useSelector((state: RootState) => state.fileTab.activeTabFullPath);
  const fileCache = useSelector((state: RootState) => state.fileTab.fileCache);
  const fileTabs = useSelector((state: RootState) => state.fileTab.fileTabs);
  const dirtyFiles = useSelector((state: RootState) => state.fileTab.dirtyFiles); 

  const activeFile = activeTabPath ? fileTabs.get(activeTabPath) : undefined;
  const cachedContent = activeTabPath ? fileCache.get(activeTabPath) : undefined;

  const [editorValue, setEditorValue] = useState(cachedContent?.code || "");

  useEffect(() => {
    if (cachedContent) {
      setEditorValue(cachedContent.code);
    } else {
      setEditorValue("");
    }
  }, [activeTabPath, cachedContent?.code]);

  useEffect(() => {
    if (monaco) {
      console.log("here is the monaco instance:", monaco);
    }
  }, [monaco]);

  function handleEditorChange(value: string | undefined): void {
    const newValue = value || "";
    setEditorValue(newValue);
    
    if (activeTabPath) {
      dispatch(updateFileCode({ filepath: activeTabPath, code: newValue }));
    }
  }

  const handleSaveFile = async () => {
    if (!activeTabPath || !cachedContent) return;

    try {
      const response = await fetch('http://localhost:4200/v1/api/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filepath: activeTabPath,
          content: cachedContent.code,
        }),
      });

      if (response.ok) {
        dispatch(markFileSaved(activeTabPath));
        console.log(`✅ Saved: ${activeTabPath}`);
      }
    } catch (err) {
      console.error('❌ Failed to save file:', err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabPath, cachedContent]);

  // language from filename
  const getLanguage = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      jsx: "javascript",
      tsx: "typescript",
      json: "json",
      html: "html",
      css: "css",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      rb: "ruby",
      php: "php",
      rs: "rust",
      swift: "swift",
      kt: "kotlin",
      scala: "scala",
      sh: "shell",
      md: "markdown",
    };
    return languageMap[ext || ""] || "plaintext";
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1e1e1e",
        width: "100%",
        height: "calc(100vh)",
        color: "#fff",
        transition: "height 0.1s ease",
      }}
    >
      <FileTabs />
      {/* ✅ Show dirty indicator */}
      {activeTabPath && dirtyFiles.has(activeTabPath) && (
        <Box sx={{ padding: 1, backgroundColor: "#333", color: "#ffa500", fontSize: 12 }}>
          ● Unsaved changes
        </Box>
      )}
      <Box
        sx={{
          flexGrow: 1,
          padding: 2,
          backgroundColor: "#1e1e1e",
          color: "#fff",
        }}
      >
        {activeFile ? (
          <Editor
            theme={theme || "vs-dark"}
            height="100%"
            language={getLanguage(activeFile.filename)}
            value={editorValue}
            onChange={handleEditorChange}
            className="editor"
          />
        ) : (
          <Box sx={{ color: "grey.500", textAlign: "center", marginTop: 10 }}>
            No file selected
          </Box>
        )}
      </Box>
    </Box>
  );
}