import { Outlet } from "react-router-dom";
import SideBar from "../components/shared/SideBar";

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sol taraf: Sabit Sidebar */}
      <SideBar />

      {/* Sağ taraf: Değişen İçerik Alanı */}
      <main className="flex-1 overflow-y-auto">
        {/* Outlet, iç içe geçmiş rotaların (Overview gibi) buraya gelmesini sağlar */}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
