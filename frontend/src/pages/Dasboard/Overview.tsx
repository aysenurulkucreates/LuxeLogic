import { useQuery } from "@apollo/client";
import {
  GET_ME,
  GET_DASHBOARD_STATS,
  GET_RECENT_CUSTOMERS,
} from "../../graphql/queries/auth";
import { useState } from "react";
import AddCustomerModal from "../../components/shared/AddCustomerModal";
import {
  Users,
  Calendar,
  Briefcase,
  ArrowUpRight,
  Plus,
  Activity,
  Boxes,
  User,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const Overview: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { loading, error, data } = useQuery(GET_ME);
  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
  } = useQuery(GET_DASHBOARD_STATS);
  const { data: recentData, loading: recentLoading } =
    useQuery(GET_RECENT_CUSTOMERS);

  if (loading || statsLoading || recentLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        {/* 🏥 O meşhur LuxeLogic animasyonumuz */}
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-black tracking-widest uppercase text-[10px] animate-pulse">
          LuxeLogic Statistics Initializing...
        </p>
      </div>
    );
  }

  if (error || statsError) {
    return (
      <div className="p-10 max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-100 rounded-4xl p-8 text-center shadow-xl shadow-rose-100/20">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity size={32} />
          </div>
          <h2 className="text-xl font-black text-rose-900 mb-2">
            Diagnostic Failure
          </h2>
          <p className="text-rose-600/70 font-medium">
            {error?.message ||
              statsError?.message ||
              "An unexpected error occurred while fetching clinic data."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-8 py-3 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
          >
            Restart System
          </button>
        </div>
      </div>
    );
  }

  if (!data?.me)
    return (
      <div className="p-8 text-slate-500 font-bold">
        Please login to access the clinic dashboard.
      </div>
    );

  const userName = data.me.email.split("@")[0];

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* 🌟 Karşılanma (Welcome) */}
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Welcome, <span className="text-indigo-600">{userName}</span>! 👋
        </h1>
        <p className="text-slate-500 font-medium mt-2">
          Here's what's happening at your clinic today.
        </p>
      </div>
      {/* 📊 Üst İstatistik Kartları (The Luxe Quads) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {/* Kart 1: Customers */}
        <div className="bg-white p-7 rounded-rounded4xl shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <span className="flex items-center gap-1 text-emerald-500 text-xs font-black bg-emerald-50 px-2 py-1 rounded-lg">
              <ArrowUpRight size={14} /> +12%
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">
            Total Customers
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">
            {statsData?.getDashboardStats?.customerCount || 0}
          </p>
        </div>
        {/* Kart 2: Appointments */}
        <div className="bg-white p-7 rounded-rounded4xl shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Calendar size={24} />
            </div>
            <span className="text-purple-500 text-[10px] font-black uppercase bg-purple-50 px-2 py-1 rounded-lg tracking-tighter">
              Today
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">
            Appointments
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">
            {statsData?.getDashboardStats?.appointmentCount || 0}
          </p>
        </div>
        {/* Kart 3: Active Staff */}
        <div className="bg-white p-7 rounded-rounded4xl shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Briefcase size={24} />
            </div>
            <span className="text-blue-500 text-[10px] font-black uppercase bg-blue-50 px-2 py-1 rounded-lg tracking-tighter">
              On Duty
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">
            Active Staff
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">
            {statsData?.getDashboardStats?.staffCount || 0}
          </p>
        </div>
        {/* Kart 4: Inventory (Products) */}
        <div className="bg-white p-7 rounded-rounded4xl shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Boxes size={24} />
            </div>
            <span className="text-emerald-500 text-[10px] font-black uppercase bg-emerald-50 px-2 py-1 rounded-lg tracking-tighter">
              Inventory
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">
            Total Products
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">
            {statsData?.getDashboardStats?.productCount || 0}
          </p>
        </div>
      </div>
      {/* 🏗️ Alt Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 📋 Son İşlemler (Recent Activity) */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Recent Activity
            </h2>
            <button className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline transition-all">
              View All Report
            </button>
          </div>

          <div className="space-y-6">
            {recentData?.getRecentCustomers?.map((customer: Customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-5 hover:bg-indigo-50/30 rounded-3xl transition-all group border border-transparent hover:border-indigo-50"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">
                      {customer.name}
                    </p>
                    <p className="font-bold text-slate-800 text-lg">
                      {customer.email}
                    </p>
                    <p className="text-sm text-slate-400 font-medium tracking-tight">
                      System registration completed successfully.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-300 group-hover:text-indigo-500 transition-colors uppercase">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 🚀 Hızlı Aksiyon Kartı (Fast Action) */}
        <div className="bg-linear-to-br from-indigo-600 to-violet-700 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
              <Plus size={28} />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tighter">
              Fast Action
            </h2>
            <p className="text-indigo-100 font-medium leading-relaxed">
              Streamline your workflow by initiating a new customer registration
              immediately.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full bg-white text-indigo-600 py-5 rounded-3xl font-black text-lg shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 mt-10 relative z-10"
          >
            Create New Profile
          </button>
        </div>
      </div>
      {/* Modal */}
      <AddCustomerModal
        key={isAddModalOpen ? "open" : "closed"}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Overview;
