import React from "react";
import Preview from "./preview";
import Tabs from "./tab";
import { Box } from "@mui/material";
import { WebViewProvider } from "./context";

const WebView: React.FC = () => {
  return (
    <WebViewProvider>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <Tabs />
        <Preview />
      </Box>
    </WebViewProvider>
  );
};

export default WebView;
