// DYNAMIC CODE TAB SLICE WITH CODE UPDATE ACTION WITH FILE CACHING MECHANISM
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";

export interface FileTabProps {
  filename: string;
  filepath: string;
  overlap: number;
  isActive: boolean;
}

interface FileContent {
  code: string;                    
  lastSavedCode: string;
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
        state.fileCache.set(action.payload.filepath, {
          code: code,
          lastSavedCode: code,
          timestamp: Date.now(),
          isDirty: false,
        });

        // Limit cache size to MAX_CACHE_SIZE
        if (state.fileCache.size > MAX_CACHE_SIZE) {
          let oldestFilepath: string | null = null;
          let oldestTimestamp = Date.now();

          for (const [filepath, cached] of state.fileCache.entries()) {
            if (!state.fileTabs.has(filepath) && cached.timestamp < oldestTimestamp) {
              oldestTimestamp = cached.timestamp;
              oldestFilepath = filepath;
            }
          }

          if (oldestFilepath) {
            state.fileCache.delete(oldestFilepath);
          }
        }
      } else {
        const cached = state.fileCache.get(action.payload.filepath);
        if (cached) {
          cached.timestamp = Date.now();
        }
      }

      // Handle tab visibility
      if (!state.fileTabs.has(action.payload.filepath)) {
        if (state.activeTabFullPath) {
          const currSelectedFile = state.fileTabs.get(state.activeTabFullPath);
          if (currSelectedFile) currSelectedFile.isActive = false;
        }
        
        state.fileTabs.set(action.payload.filepath, {
          ...tabInfo,
          isActive: true,
        });
        state.activeTabFullPath = action.payload.filepath;
      } else {
        if (state.activeTabFullPath !== action.payload.filepath) {
          if (state.activeTabFullPath) {
            const currSelectedFile = state.fileTabs.get(state.activeTabFullPath);
            if (currSelectedFile) currSelectedFile.isActive = false;
          }
          
          const selectedTab = state.fileTabs.get(action.payload.filepath);
          if (selectedTab) {
            selectedTab.isActive = true;
            state.activeTabFullPath = action.payload.filepath;
          }
        }
      }
    },

    removeFileTab: (state, action: PayloadAction<string>) => {
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

    discardChanges: (state, action: PayloadAction<string>) => {
      const cached = state.fileCache.get(action.payload);
      if (cached) {
        cached.code = cached.lastSavedCode;
        cached.isDirty = false;
        state.dirtyFiles.delete(action.payload);
      }
    },

    setActiveTab: (state, action: PayloadAction<string>) => {
      if (state.activeTabFullPath !== action.payload) {
        if (state.activeTabFullPath) {
          const currSelectedFile = state.fileTabs.get(state.activeTabFullPath);
          if (currSelectedFile) currSelectedFile.isActive = false;
        }
        
        const selectedTab = state.fileTabs.get(action.payload);
        if (selectedTab) {
          selectedTab.isActive = true;
          state.activeTabFullPath = action.payload;

          const cached = state.fileCache.get(action.payload);
          if (cached) {
            cached.timestamp = Date.now();
          }
        }
      }
    },

    updateFileCode: (state, action: PayloadAction<{ filepath: string; code: string }>) => {
      const cached = state.fileCache.get(action.payload.filepath);
      if (cached) {
        // ✅ Compare against lastSavedCode instead of original
        if (cached.code !== action.payload.code) {
          cached.code = action.payload.code;
          cached.timestamp = Date.now();
          
          if (action.payload.code !== cached.lastSavedCode) {
            cached.isDirty = true;
            state.dirtyFiles.add(action.payload.filepath);
          } else {
            cached.isDirty = false;
            state.dirtyFiles.delete(action.payload.filepath);
          }
        }
      }
    },

    markFileSaved: (state, action: PayloadAction<string>) => {
      const cached = state.fileCache.get(action.payload);
      if (cached) {
        cached.lastSavedCode = cached.code;
        cached.isDirty = false;
      }
      state.dirtyFiles.delete(action.payload);
    },

    saveAllFiles: (state) => {
      // This will be used to trigger save-all action
      for (const [filepath, cached] of state.fileCache.entries()) {
        if (cached.isDirty) {
          // Trigger save for each dirty file
          // You can implement the actual save logic here
          saveFile(filepath, cached.code);
        }
      }
    },

    clearStaleCache: (state) => {
      const oneHourAgo = Date.now() - 3600000;

      for (const [filepath, cached] of state.fileCache.entries()) {
        if (!state.fileTabs.has(filepath) && cached.timestamp < oneHourAgo) {
          state.fileCache.delete(filepath);
        }
      }
    },

    clearAllCache: (state) => {
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
  discardChanges,
  setActiveTab, 
  updateFileCode, 
  markFileSaved,
  saveAllFiles,
  clearStaleCache,
  clearAllCache 
} = fileTabSlice.actions;

export default fileTabSlice.reducer;

async function saveFile(filepath: string, code: string) {
  const dispatch = useDispatch();
  if (!filepath || !code) return;

  try {
    const response = await fetch('http://localhost:4200/v1/api/save-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filepath: filepath,
        content: code,
      }),
    });

    if (response.ok) {
      dispatch(markFileSaved(filepath));
      console.log(`✅ Saved: ${filepath}`);
    }
  } catch (err) {
    console.error('❌ Failed to save file:', err);
  }
}

