// FileTabs.tsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../app/store.ts";
import { setActiveTab, removeFileTab } from "../../features/FileTabs/fileTabSlice";
import { Tabs, Tab, Box, Typography } from "@mui/material";
import { IoMdCloseCircle } from "react-icons/io";

const FileTabs: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const fileTabsMap = useSelector((state: RootState) => state.fileTab.fileTabs);

  // Convert the Map to an array for rendering
  const fileTabs = Array.from(fileTabsMap.values());

  // Find the active tab's filepath
  const activeTab = fileTabs.find((tab) => tab.isActive)?.filepath || false;

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    dispatch(setActiveTab(newValue));
  };

  const handleClose = (filepath: string) => (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation(); // Prevent triggering tab selection
    dispatch(removeFileTab(filepath));
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="file tabs"
        TabIndicatorProps={{
          style: {
            backgroundColor: "#ffffff",
          }
        }}
        >
        {fileTabs.map((tab) => (
          <Tab 
            key={tab.filepath}
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography 
                variant="caption"
                  sx={{color: tab.isActive ? "#ffffff" : "#9e9e9e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", mr: 1 }}>
                  {tab.filename}
              </Typography>
                <IoMdCloseCircle onClick={handleClose(tab.filepath)} color={tab.isActive ? "#ffffff" : "#9e9e9e"}/>
              </Box>
            }
            value={tab.filepath}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default FileTabs;
