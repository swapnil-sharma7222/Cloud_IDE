import React, { useState, ChangeEvent, FormEvent, useContext } from "react";
import { Box, Button, TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { WebViewContext } from "./context";

const Tabs: React.FC = () => {
  const context= useContext(WebViewContext);

  if(!context){
    throw new Error("The WebViewContext is not provided in tabs");
  }

  const { url, setUrl } = context;
  const [localUrl, setLocalUrl] = useState<string>(url);
  // Handle URL input change
  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocalUrl(e.target.value);
  };

  // Handle form submission
  const handleUrlSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form behavior
    if (localUrl) {
      // Ensure the URL starts with http/https
      setUrl(localUrl.startsWith("http") ? localUrl : `https://${localUrl}`);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      {/* URL Input Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          // padding: 1,
          border: "5px solid #ccc",
        }}
      >
        <Box component="form" onSubmit={handleUrlSubmit}>
          <TextField
            variant="outlined"
            fullWidth
            value={localUrl}
            onChange={handleUrlChange}
            size="small"
          />
        </Box>
        <Box>
          <Button variant="outlined" endIcon={<SendIcon />} size="small" href={localUrl} target="_blank">
            New Tab
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Tabs;
