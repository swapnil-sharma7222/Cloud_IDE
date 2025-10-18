import { Box } from "@mui/material";
import { useContext } from "react";
import { WebViewContext } from "./context";

const Preview: React.FC = () => {
  const context = useContext(WebViewContext);

  if (!context) {
    throw new Error("The WebView context is not provided in the preview");
  }

  const { url } = context;

  return (
    <Box sx={{ flexGrow: 1, overflow: "scroll" }}>
      <iframe
        src={url}
        width="100%"
        height="100%"
        style={{ border: "none" }}
        title="Webview"
      />
    </Box>
  );
};

export default Preview;
