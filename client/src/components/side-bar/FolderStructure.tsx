import { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { Box } from '@mui/material';
import SidebarItem from './SidebarItem.tsx';
import { useParams } from 'react-router-dom';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export default function FolderStructure() {
  const [structure, setStructure] = useState<FileNode[]>([]);
  const { socket, isConnected } = useSocket();

  const userId= useParams().userId;

  useEffect(() => {
    fetch(`http://localhost:4200/v1/api/folder-structure?userId=${userId}&filePath=/`)
      .then((res) => res.json())
      .then((data) => setStructure(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // ✅ Listen for folder structure updates
    socket.on('folderStructureUpdate', (structure: FileNode[]) => {
      console.log('📁 Folder structure updated:', structure);
      setStructure(structure);
    });

    return () => {
      socket.off('folderStructureUpdate');
    };
  }, [socket, isConnected]);

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
}