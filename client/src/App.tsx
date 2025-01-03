import './App.css'
import Dashboard from './pages/Dashboard'
import { Provider } from "react-redux";
import {store} from "./app/store";

function App() {

  return (
    <Provider store={store}>
      <Dashboard/>
    </Provider>
  )
}

export default App