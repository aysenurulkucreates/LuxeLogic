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
import ProductList from "./pages/Dasboard/products/Products";
import StaffList from "./pages/Dasboard/staff/StaffList";
import AppointmentList from "./pages/Dasboard/appointments/AppointmentList";
import SaleList from "./pages/Dasboard/sales/SaleList";
import CustomerDetailPage from "./pages/Dasboard/customers/[id]";
import AppointmentDetailPage from "./pages/Dasboard/appointments/[id]";
import ProductDetailPage from "./pages/Dasboard/products/[id]";
import StaffDetailPage from "./pages/Dasboard/staff/[id]";
import SaleDetailPage from "./pages/Dasboard/sales/[id]";

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
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/staff" element={<StaffList />} />
          <Route path="/staff/:id" element={<StaffDetailPage />} />
          <Route path="/appointments" element={<AppointmentList />} />
          <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
          <Route path="/sales" element={<SaleList />} />
          <Route path="/sales/:id" element={<SaleDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
