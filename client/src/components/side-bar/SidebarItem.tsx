// SIDEBAR WITH FILE API CALL AND CACHED TABS

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { FiFolder, FiFile, FiArrowRight, FiArrowDown } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../app/store";
import { addFileTab } from "../../features/FileTabs/fileTabSlice";
import { useParams } from "react-router-dom";

interface SidebarItemProps {
  item: {
    name: string;
    type: "folder" | "file";
    children?: SidebarItemProps["item"][];
  };
  parentPath?: string;
}

const SideBarItem: React.FC<SidebarItemProps> = ({ item, parentPath = "" }) => {
  const [isOpenFolder, setIsOpenFolder] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const userId= useParams().userId;
  
  const fileCache = useSelector((state: RootState) => state.fileTab.fileCache);
  
  const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;

  const handleClick = async () => {
    if (item.type === "file") {
      const cachedContent = fileCache.get(currentPath);
      
      if (cachedContent) {
        // File content is cached, reopen with cached data
        dispatch(
          addFileTab({
            filename: item.name,
            filepath: currentPath,
            overlap: 0,
            isActive: true,
            code: cachedContent.code,
          })
        );
      } else {
        // File not cached, fetch from backend
        try {
          const response = await fetch(
            `http://localhost:4200/v1/api/file-data?userId=${userId}&path=${encodeURIComponent(currentPath)}`
          );
          const data = await response.json();

          dispatch(
            addFileTab({
              filename: item.name,
              filepath: currentPath,
              overlap: 0,
              isActive: true,
              code: data.content ?? "",
            })
          );
        } catch (err) {
          console.error("❌ Failed to load file", err);
        }
      }
    } else {
      setIsOpenFolder((prev) => !prev);
    }
  };

  return (
    <Box>
      <Box
        onClick={handleClick}
        sx={{
          display: "flex",
          alignItems: "center",
          paddingY: 1,
          paddingLeft: 2,
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "grey.700",
          },
        }}
      >
        {item.type === "folder" ? (
          <>
            {isOpenFolder ? (
              <FiArrowDown style={{ marginRight: 8 }} />
            ) : (
              <FiArrowRight style={{ marginRight: 8 }} />
            )}
            <FiFolder style={{ marginRight: 8 }} />
          </>
        ) : (
          <FiFile style={{ marginRight: 8 }} />
        )}
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          {item.name}
        </Typography>
      </Box>

      {isOpenFolder && item.type === "folder" && item.children && (
        <Box sx={{ marginLeft: 3 }}>
          {item.children.map((child) => (
            <SideBarItem
              key={child.name}
              item={child}
              parentPath={currentPath}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SideBarItem;