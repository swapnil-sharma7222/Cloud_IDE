import { BrowserRouter, Routes, Route } from "react-router-dom";

import './App.css'
import Dashboard from './pages/Dashboard'
import { Provider } from "react-redux";
import {store} from "./app/store";
import LandingPage from './pages/Landing';
import { SocketProvider } from "./contexts/SocketContext";

function App() {

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/:userId/dashboard"
            element={
              <SocketProvider>
                <Dashboard />
              </SocketProvider>
            }
          />

          <Route
            path="/:userId/dashboard/:roomId"
            element={
              <SocketProvider>
                <Dashboard />
              </SocketProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App