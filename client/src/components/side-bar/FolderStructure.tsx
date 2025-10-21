import { FC, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import SidebarItem from './SidebarItem.tsx';

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

const FolderStructure: FC = () => {
  const [structure, setStructure] = useState<FileNode[]>([]);

  useEffect(() => {
    fetch("http://localhost:4200/v1/api/folder-structure")
      .then((res) => res.json())
      .then((data) => setStructure(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <Box
      sx={{
        minWidth:'100rem',
        // width: '16.67%', // equivalent to 1/6th of full width
        backgroundColor: 'grey.800',
        color: 'common.white',
        height: '100vh',
        overflowY: 'auto'
      }}
    >
      {/* <SidebarItem nodes={structure} /> */}
      {structure.map((item) => (
        <SidebarItem key={item.name} item={item} />
      ))}
    </Box>
  );
};

export default FolderStructure;