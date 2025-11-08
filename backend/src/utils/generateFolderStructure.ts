import express from 'express'
import fs from 'fs'
import path from 'path'

export interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.cache',
  '.next',
  'dist',
  'build',
])

export function getFolderStructure(dir: string): FileNode[] {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    // Unable to read this directory (permissions, etc.) → skip
    return []
  }

  return entries.map((entry): FileNode => {
    const name = entry.name

    // Skip known heavy/system folders
    if (entry.isDirectory() && IGNORED_DIRS.has(name)) {
      return {
        name,
        type: 'folder',
        children: [],
      }
    }

    // Do not follow symlinks to avoid permission issues and cycles
    if (entry.isSymbolicLink()) {
      return {
        name,
        type: 'file',
      }
    }

    if (entry.isDirectory()) {
      const fullPath = path.join(dir, name)
      return {
        name,
        type: 'folder',
        children: getFolderStructure(fullPath),
      }
    }

    return {
      name,
      type: 'file',
    }
  })
}