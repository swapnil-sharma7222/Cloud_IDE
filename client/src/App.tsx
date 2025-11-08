import { BrowserRouter, Routes, Route } from "react-router-dom";

import './App.css'
import Dashboard from './pages/Dashboard'
import { Provider } from "react-redux";
import {store} from "./app/store";
import LandingPage from './pages/Landing';

function App() {

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/:userId/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App