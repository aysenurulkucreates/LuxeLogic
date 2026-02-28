import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import CustomerList from "./pages/Dasboard/customers/CustomerList";
import "../src/App.css";
import Signin from "./pages/Auth/Signin";
import Signup from "./pages/Auth/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import Overview from "./pages/Dasboard/Overview";
import DashboardLayout from "./layouts/DashboardLayout";
import ProfilePage from "./pages/Auth/Profile";

function App() {
  return (
    <Router>
      <Routes>
        {/* Herkese Açık Kapılar */}
        <Route path="/" element={<Navigate to={"/signin"} />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Buradaki sayfalar DashboardLayout'un içindeki <Outlet /> kısmına yerleşir */}
          <Route path="/overview" element={<Overview />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
