import React, { FC } from 'react';
import { Box } from '@mui/material';
import SidebarItem from './SidebarItem.tsx';

const FolderStructure: FC = () => {
  const folderStructure = {
    name: 'VSCode_Clone',
    type: 'folder',
    children: [
      {
        name: 'public',
        type: 'folder',
        children: [],
      },
      {
        name: 'src',
        type: 'folder',
        children: [
          {
            name: 'assets',
            type: 'folder',
            children: [],
          },
          {
            name: 'components',
            type: 'folder',
            children: [
              {
                name: 'ActivityBar',
                type: 'folder',
                children: [{ name: 'ActivityBar.tsx', type: 'file' }],
              },
              {
                name: 'Editor',
                type: 'folder',
                children: [
                  { name: 'Editor.tsx', type: 'file' },
                  { name: 'Tab.tsx', type: 'file' },
                ],
              },
              {
                name: 'Sidebar',
                type: 'folder',
                children: [
                  { name: 'Sidebar.tsx', type: 'file' },
                  { name: 'SidebarItem.tsx', type: 'file' },
                ],
              },
              {
                name: 'StatusBar',
                type: 'folder',
                children: [{ name: 'StatusBar.tsx', type: 'file' }],
              },
            ],
          },
          {
            name: 'styles',
            type: 'folder',
            children: [{ name: 'App.tsx', type: 'file' }],
          },
          { name: 'index.css', type: 'file' },
          { name: 'main.tsx', type: 'file' },
          { name: 'vite-env.d.ts', type: 'file' },
        ],
      },
      { name: '.gitignore', type: 'file' },
      { name: 'eslint.config.js', type: 'file' },
      { name: 'index.html', type: 'file' },
      { name: 'package-lock.json', type: 'file' },
      { name: 'package.json', type: 'file' },
      { name: 'postcss.config.js', type: 'file' },
      { name: 'README.md', type: 'file' },
      { name: 'tailwind.config.js', type: 'file' },
      { name: 'tsconfig.app.json', type: 'file' },
      { name: 'tsconfig.json', type: 'file' },
    ],
  };

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
      <SidebarItem item={folderStructure} level={0} />
    </Box>
  );
};

export default FolderStructure;