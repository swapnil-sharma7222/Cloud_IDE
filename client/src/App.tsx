import './App.css'
import Dashboard from './pages/Dashboard'
import { Provider } from "react-redux";
import {store} from "./app/store";
import LandingPage from './pages/Landing';

function App() {

  return (
    <Provider store={store}>
      <LandingPage/>
    </Provider>
  )
}

export default App