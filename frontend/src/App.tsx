import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import CustomerList from "./pages/Dasboard/customers/CustomerList";
import "../src/App.css";
import Signin from "./pages/Auth/Signin";
import Signup from "./pages/Auth/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
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
import { PAGE_ROLES } from "./config/permissions";

function App() {
  return (
    <Router>
      {/* Tüm sayfaların bildirimleri için tek Toaster */}
      <Toaster position="top-right" reverseOrder={false} />
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

          {/* giriş yapan herkese açık */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* rol gerektiren sayfalar (roller config/permissions.ts içinde) */}
          <Route
            path="/overview"
            element={
              <RoleGuard allowedRoles={PAGE_ROLES.overview}>
                <Overview />
              </RoleGuard>
            }
          />
          <Route
            path="/appointments"
            element={
              <RoleGuard allowedRoles={PAGE_ROLES.appointments}>
                <AppointmentList />
              </RoleGuard>
            }
          />
          <Route
            path="/appointments/:id"
            element={
              <RoleGuard allowedRoles={PAGE_ROLES.appointments}>
                <AppointmentDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="/customers"
            element={
              <RoleGuard allowedRoles={PAGE_ROLES.customers}>
                <CustomerList />
              </RoleGuard>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <RoleGuard allowedRoles={PAGE_ROLES.customers}>
                <CustomerDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="/products"
            element={
              <RoleGuard allowedRoles={PAGE_ROLES.products}>
                <ProductList />
              </RoleGuard>
            }
          />
          <Route
            path="/products/:id"
            element={
              <RoleGuard allowedRoles={PAGE_ROLES.products}>
                <ProductDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="/staff"
            element={
              <RoleGuard allowedRoles={PAGE_ROLES.staff}>
                <StaffList />
              </RoleGuard>
            }
          />
          <Route
            path="/staff/:id"
            element={
              <RoleGuard allowedRoles={PAGE_ROLES.staff}>
                <StaffDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="/sales"
            element={
              <RoleGuard allowedRoles={PAGE_ROLES.sales}>
                <SaleList />
              </RoleGuard>
            }
          />
          <Route
            path="/sales/:id"
            element={
              <RoleGuard allowedRoles={PAGE_ROLES.sales}>
                <SaleDetailPage />
              </RoleGuard>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
