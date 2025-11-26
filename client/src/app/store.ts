// store.ts
import { configureStore } from "@reduxjs/toolkit";
import fileTabReducer from "../features/FileTabs/fileTabSlice"; // Ensure the correct path
import { enableMapSet } from "immer";
import userReducer from '../features/user/userSlice';

// Enable Map and Set support in Immer
enableMapSet();

export const store = configureStore({
  reducer: {
    fileTab: fileTabReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore actions that handle non-serializable data
        ignoredActions: [
          "fileTab/addFileTab",
          "fileTab/removeFileTab",
          "fileTab/setActiveTab",
          "fileTab/updateFileCode",
          "fileTab/markFileSaved",
          "fileTab/saveAllFiles"
        ],
        // Ignore specific paths in the state
        ignoredPaths: [
          "fileTab.fileTabs",
          "fileTab.fileCache",
          "fileTab.dirtyFiles",
        ],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
