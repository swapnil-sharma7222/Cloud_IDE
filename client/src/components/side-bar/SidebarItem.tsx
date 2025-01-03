// SideBarItem.tsx
import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { FiArrowDown, FiArrowRight, FiFile, FiFolder } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../app/store";
import { addFileTab } from "../../features/FileTabs/fileTabSlice";

interface SidebarItemProps {
  item: {
    name: string;
    type: "folder" | "file";
    children?: SidebarItemProps["item"][];
  };
  level: number;
}

const SideBarItem: React.FC<SidebarItemProps> = ({ item, level }) => {
  const [isOpenFolder, setIsOpenFolder] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const handleClick = () => {
    if (item.type === "file") {
      // Dispatch addFileTab action with file details
      dispatch(
        addFileTab({
          filename: item.name,
          filepath: `path/to/${item.name}`, // Adjust the filepath as needed
          overlap: 0, // Define how overlap is calculated if needed
          isActive: true,
        })
      );
    } else {
      setIsOpenFolder(!isOpenFolder);
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
          paddingLeft: `${level * 1.5}rem`,
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

      {/* Render children if folder is open */}
      {isOpenFolder && item.type === "folder" && item.children && (
        <Box>
          {item.children.map((child) => (
            <SideBarItem key={child.name} item={child} level={level + 1} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SideBarItem;


// import React, { useState } from 'react';
// import { Box, Typography } from '@mui/material';
// import { FiArrowDown, FiArrowRight, FiFile, FiFolder } from 'react-icons/fi';

// interface SidebarItemProps {
//   item: {
//     name: string;
//     type: 'folder' | 'file';
//     children?: SidebarItemProps['item'][];
//     onOpenFile: (file: { filename: string; filepath: string; overlap: number }) => void;
//   };
//   level: number;
// }

// const SidebarItem: React.FC<SidebarItemProps> = ({ item, level, onOpenFile }) => {
//   const [isOpenFolder, setIsOpenFolder] = useState(false);

//   const handleClick = () => {
//     if (item.type === 'file') {
//       onOpenFile({ filename: item.name, filepath: `path/to/${item.name}`, overlap: 0 });
//     } else {
//       setIsOpenFolder(!isOpenFolder);
//     }
//   };

//   return (
//     <Box>
//       <Box
//         onClick={handleClick}
//         sx={{
//           display: 'flex',
//           alignItems: 'center',
//           paddingY: 1,
//           paddingLeft: `${level * 1.5}rem`,
//           cursor: 'pointer',
//           '&:hover': {
//             backgroundColor: 'grey.700',
//           },
//         }}
//       >
//         {item.type === 'folder' ? (
//           <>
//             {isOpenFolder ? (
//               <FiArrowDown style={{ marginRight: 8 }} />
//             ) : (
//               <FiArrowRight style={{ marginRight: 8 }} />
//             )}
//             <FiFolder style={{ marginRight: 8 }} />
//           </>
//         ) : (
//           <FiFile style={{ marginRight: 8 }} />
//         )}
//         <Typography variant="body2" sx={{ flexGrow: 1 }}>
//           {item.name}
//         </Typography>
//       </Box>

//       {/* Render children if folder is open */}
//       {isOpenFolder && item.type === 'folder' && item.children && (
//         <Box>
//           {item.children.map((child) => (
//             <SidebarItem key={child.name} item={child} level={level + 1} />
//           ))}
//         </Box>
//       )}
//     </Box>
//   );
// };

// export default SidebarItem;