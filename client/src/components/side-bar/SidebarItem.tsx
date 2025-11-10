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
  const [children, setChildren] = useState<SidebarItemProps["item"][]>(item.children || []);
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { userId } = useParams<{ userId: string }>();
  
  const fileCache = useSelector((state: RootState) => state.fileTab.fileCache);
  
  const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;

  const handleClick = async () => {
    if (item.type === "file") {
      const cachedContent = fileCache.get(currentPath);
      
      if (cachedContent) {
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
      if (!isOpenFolder && children.length === 0) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `http://localhost:4200/v1/api/folder-structure?userId=${userId}&filePath=${encodeURIComponent(currentPath)}`
          );
          const data = await response.json();
          
          
          setChildren(data);
        } catch (err) {
          console.error("❌ Failed to load folder structure", err);
        } finally {
          setIsLoading(false);
        }
      }
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
        {isLoading && (
          <Typography variant="caption" sx={{ color: 'grey.500', marginLeft: 1 }}>
            Loading...
          </Typography>
        )}
      </Box>

      {isOpenFolder && item.type === "folder" && (
        <Box sx={{ marginLeft: 3 }}>
          {children.length > 0 ? (
            children.map((child) => (
              <SideBarItem
                key={child.name}
                item={child}
                parentPath={currentPath}
              />
            ))
          ) : (
            !isLoading && (
              <Typography variant="caption" sx={{ color: 'grey.500', paddingLeft: 2 }}>
                Empty folder
              </Typography>
            )
          )}
        </Box>
      )}
    </Box>
  );
};

export default SideBarItem;