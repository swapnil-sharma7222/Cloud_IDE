import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import './App.css'
import Dashboard from './pages/Dashboard'
import { Provider } from "react-redux";
import {store} from "./app/store";
import LandingPage from './pages/Landing';
import { SocketProvider } from "./contexts/SocketContext";
import Auth from "./pages/Auth";
import ProtectedRoute from "./contexts/ProtectedRoute";

function App() {

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          } />
          <Route
            path="/:userId/dashboard"
            element={
              <ProtectedRoute>
                <SocketProvider>
                  <Dashboard />
                </SocketProvider>
              </ProtectedRoute>
            }
          />

          <Route
            path="/:userId/dashboard/:roomId"
            element={
              <ProtectedRoute>
                <SocketProvider>
                  <Dashboard />
                </SocketProvider>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App