import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MyCustomers from "./pages/MyCustomers";
import "../src/App.css";
import Signin from "./pages/Signin";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={"/signin"} />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/customers" element={<MyCustomers />} />
      </Routes>
    </Router>
  );
}

export default App;
