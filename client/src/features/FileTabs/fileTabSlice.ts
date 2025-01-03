// fileTabSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the properties of a single file tab
export interface FileTabProps {
  filename: string;
  filepath: string;
  overlap: number;
  isActive: boolean;
  code: string;
}

// Define the initial state structure
interface FileTabState {
  fileTabs: Map<string, FileTabProps>; // Keyed by filepath for uniqueness
  activeTabFullPath: string | undefined,
}

const initialState: FileTabState = {
  fileTabs: new Map<string, FileTabProps>(),
  activeTabFullPath: undefined,
};

// Create the slice
export const fileTabSlice = createSlice({
  name: "fileTab",
  initialState,
  reducers: {
    // Action to add a new file tab
    addFileTab: (state, action: PayloadAction<FileTabProps>) => {
        
      if(!state.fileTabs.has(action.payload.filepath)) {
        if(state.activeTabFullPath !== undefined) {
            const currSelectedFile = state.fileTabs.get(state.activeTabFullPath)
            currSelectedFile!.isActive = false
        }
        // Add or update the new tab and set it as active
        state.fileTabs.set(action.payload.filepath, {
            ...action.payload,
            isActive: true,
        });
        state.activeTabFullPath = action.payload.filepath
      } else {
        if(state.activeTabFullPath != undefined && state.activeTabFullPath !== action.payload.filepath) {
            // Activate the selected tab
            const selectedTab = state.fileTabs.get(action.payload.filepath);
            if (selectedTab) {
                selectedTab.isActive = true;  
            }

            const currSelectedFile = state.fileTabs.get(state.activeTabFullPath)
            currSelectedFile!.isActive = false
            
            state.activeTabFullPath = action.payload.filepath
        }
      }

    },

    // Action to remove a file tab
    removeFileTab: (state, action: PayloadAction<string>) => {
      // Remove the tab by filepath
      state.fileTabs.delete(action.payload);

      // If the removed tab was active, activate the first available tab
      if (action.payload === state.activeTabFullPath) {
        const firstTab = state.fileTabs.values().next().value;
        if (firstTab) {
          firstTab.isActive = true;
          state.activeTabFullPath = firstTab.filepath
        }
      }

      if(state.fileTabs.size === 0) state.activeTabFullPath = undefined;
    },

    // Action to set a specific tab as active
    setActiveTab: (state, action: PayloadAction<string>) => {
        // Deactivate all tabs
        if(state.activeTabFullPath != undefined && state.activeTabFullPath !== action.payload) {
            // Activate the selected tab
            const selectedTab = state.fileTabs.get(action.payload);
            if (selectedTab) {
                selectedTab.isActive = true;  
            }

            const currSelectedFile = state.fileTabs.get(state.activeTabFullPath)
            currSelectedFile!.isActive = false
            
            state.activeTabFullPath = action.payload
        }
    },
  },
});

// Export the actions
export const { addFileTab, removeFileTab, setActiveTab } = fileTabSlice.actions;

// Export the reducer to be included in the store
export default fileTabSlice.reducer;
