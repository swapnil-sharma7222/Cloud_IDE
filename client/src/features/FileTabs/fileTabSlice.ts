// DYNAMIC CODE TAB SLICE WITH CODE UPDATE ACTION WITH FILE CACHING MECHANISM
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FileTabProps {
  filename: string;
  filepath: string;
  overlap: number;
  isActive: boolean;
}

interface FileContent {
  code: string;
  timestamp: number;
  isDirty: boolean;
}

interface FileTabState {
  fileTabs: Map<string, FileTabProps>;        
  fileCache: Map<string, FileContent>;        
  activeTabFullPath: string | null;
  dirtyFiles: Set<string>;
}

const initialState: FileTabState = {
  fileTabs: new Map(),
  fileCache: new Map(),
  activeTabFullPath: null,
  dirtyFiles: new Set(),
};

const MAX_CACHE_SIZE = 5;

export const fileTabSlice = createSlice({
  name: "fileTab",
  initialState,
  reducers: {
    addFileTab: (state, action: PayloadAction<FileTabProps & { code: string }>) => {
      const { code, ...tabInfo } = action.payload;
      
      // Check if file is already cached
      if (!state.fileCache.has(action.payload.filepath)) {
        // Add to cache
        state.fileCache.set(action.payload.filepath, {
          code: code,
          timestamp: Date.now(),
          isDirty: false,
        });

        // Limit cache size to MAX_CACHE_SIZE
        if (state.fileCache.size > MAX_CACHE_SIZE) {
          // Find oldest entry that is NOT in active tabs
          let oldestFilepath: string | null = null;
          let oldestTimestamp = Date.now();

          for (const [filepath, cached] of state.fileCache.entries()) {
            // Don't remove files that are currently open as tabs
            if (!state.fileTabs.has(filepath) && cached.timestamp < oldestTimestamp) {
              oldestTimestamp = cached.timestamp;
              oldestFilepath = filepath;
            }
          }

          // Remove oldest entry
          if (oldestFilepath) {
            state.fileCache.delete(oldestFilepath);
          }
        }
      } else {
        // Update timestamp for existing cache entry
        const cached = state.fileCache.get(action.payload.filepath);
        if (cached) {
          cached.timestamp = Date.now();
          cached.code = code; // Update with latest code
        }
      }

      // Handle tab visibility
      if (!state.fileTabs.has(action.payload.filepath)) {
        // Deactivate current tab
        if (state.activeTabFullPath) {
          const currSelectedFile = state.fileTabs.get(state.activeTabFullPath);
          if (currSelectedFile) currSelectedFile.isActive = false;
        }
        
        // Add new tab
        state.fileTabs.set(action.payload.filepath, {
          ...tabInfo,
          isActive: true,
        });
        state.activeTabFullPath = action.payload.filepath;
      } else {
        // Tab already exists, just activate it
        if (state.activeTabFullPath !== action.payload.filepath) {
          // Deactivate current
          if (state.activeTabFullPath) {
            const currSelectedFile = state.fileTabs.get(state.activeTabFullPath);
            if (currSelectedFile) currSelectedFile.isActive = false;
          }
          
          // Activate selected
          const selectedTab = state.fileTabs.get(action.payload.filepath);
          if (selectedTab) {
            selectedTab.isActive = true;
            state.activeTabFullPath = action.payload.filepath;
          }
        }
      }
    },

    removeFileTab: (state, action: PayloadAction<string>) => {
      // Remove from tab list ONLY (cache persists)
      state.fileTabs.delete(action.payload);

      if (action.payload === state.activeTabFullPath) {
        const firstTab = state.fileTabs.values().next().value;
        if (firstTab) {
          firstTab.isActive = true;
          state.activeTabFullPath = firstTab.filepath;
        } else {
          state.activeTabFullPath = null;
        }
      }
    },

    setActiveTab: (state, action: PayloadAction<string>) => {
      if (state.activeTabFullPath !== action.payload) {
        // Deactivate current
        if (state.activeTabFullPath) {
          const currSelectedFile = state.fileTabs.get(state.activeTabFullPath);
          if (currSelectedFile) currSelectedFile.isActive = false;
        }
        
        // Activate selected
        const selectedTab = state.fileTabs.get(action.payload);
        if (selectedTab) {
          selectedTab.isActive = true;
          state.activeTabFullPath = action.payload;

          // Update timestamp in cache
          const cached = state.fileCache.get(action.payload);
          if (cached) {
            cached.timestamp = Date.now();
          }
        }
      }
    },

    // updateFileCode: (state, action: PayloadAction<{ filepath: string; code: string }>) => {
    //   // Update in both tab and cache
    //   const file = state.fileTabs.get(action.payload.filepath);
    //   if (file) {
    //     // Note: FileTabProps doesn't have 'code', so we only update cache
    //     const cached = state.fileCache.get(action.payload.filepath);
    //     if (cached) {
    //       cached.code = action.payload.code;
    //       cached.timestamp = Date.now();
    //     }
    //   }
    // },

    updateFileCode: (state, action: PayloadAction<{ filepath: string; code: string }>) => {
      const cached = state.fileCache.get(action.payload.filepath);
      if (cached) {
        // ✅ Only mark as dirty if code actually changed
        if (cached.code !== action.payload.code) {
          cached.code = action.payload.code;
          cached.timestamp = Date.now();
          cached.isDirty = true;
          state.dirtyFiles.add(action.payload.filepath);
        }
      }
    },

    markFileSaved: (state, action: PayloadAction<string>) => {
      const cached = state.fileCache.get(action.payload);
      if (cached) {
        cached.isDirty = false;
      }
      state.dirtyFiles.delete(action.payload);
    },

    saveAllFiles: (state) => {
      // This will be used to trigger save-all action
      // The actual save logic will be in a thunk
    },

    // Clear stale cache entries (called manually or on app init)
    clearStaleCache: (state) => {
      const oneHourAgo = Date.now() - 3600000; // 1 hour

      for (const [filepath, cached] of state.fileCache.entries()) {
        // Don't remove files that are currently open as tabs
        if (!state.fileTabs.has(filepath) && cached.timestamp < oneHourAgo) {
          state.fileCache.delete(filepath);
        }
      }
    },

    // Manual cache clear (optional)
    clearAllCache: (state) => {
      // Keep only files that are currently open as tabs
      for (const filepath of state.fileCache.keys()) {
        if (!state.fileTabs.has(filepath)) {
          state.fileCache.delete(filepath);
        }
      }
    },
  },
});

export const { 
  addFileTab, 
  removeFileTab, 
  setActiveTab, 
  updateFileCode,
  markFileSaved,
  saveAllFiles,
  clearStaleCache,
  clearAllCache 
} = fileTabSlice.actions;

export default fileTabSlice.reducer;