import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tabs, Tab, Box, Typography } from "@mui/material";
import { IoMdCloseCircle } from "react-icons/io";
import { AppDispatch, RootState } from "../../app/store";
import { setActiveTab, removeFileTab } from "../../features/FileTabs/fileTabSlice";

export default function FileTabs() {
  const dispatch = useDispatch<AppDispatch>();
  const fileTabs = useSelector((state: RootState) => state.fileTab.fileTabs);
  const activeTabPath = useSelector((state: RootState) => state.fileTab.activeTabFullPath);
  const dirtyFiles = useSelector((state: RootState) => state.fileTab.dirtyFiles); 


  const handleTabClick = (event: React.SyntheticEvent, filepath: string) => {
    dispatch(setActiveTab(filepath));
  };

  const handleTabClose = (filepath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dirtyFiles.has(filepath)) {
      if (!window.confirm('File has unsaved changes. Close anyway?')) {
        return;
      }
    }
    dispatch(removeFileTab(filepath));
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        value={activeTabPath}
        onChange={handleTabClick}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="file tabs"
        TabIndicatorProps={{
          style: {
            backgroundColor: "#ffffff",
          },
        }}
      >
        {Array.from(fileTabs.values()).map((tab) => (
          <Tab
            key={tab.filepath}
            value={tab.filepath}
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  "&:hover svg": { opacity: 1 },
                  "svg": { opacity: 0.5, transition: "opacity 0.2s ease" },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: tab.isActive ? "#ffffff" : "#9e9e9e",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    mr: 1,
                  }}
                >
                  {tab.filename}
                </Typography>
                {dirtyFiles.has(tab.filepath) && (
                  <span style={{ color: "#f4a81bff", fontSize: "15px", paddingBlockEnd: "2px", paddingRight: "2px" }}>●</span>
                )}
                <IoMdCloseCircle
                  size={16}
                  onClick={(e) => handleTabClose(tab.filepath, e)}
                  color={tab.isActive ? "#ffffff" : "#9e9e9e"}
                  style={{ cursor: "pointer" }}
                />
              </Box>
            }
          />
        ))}
      </Tabs>
    </Box>
  );
}
