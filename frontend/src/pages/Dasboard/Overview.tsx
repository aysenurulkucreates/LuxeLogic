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
  Banknote,
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);
  };

  if (loading || statsLoading || recentLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
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
        <div className="bg-rose-50 border border-rose-100 rounded-4xl p-8 text-center shadow-xl">
          <Activity size={32} className="mx-auto mb-4 text-rose-600" />
          <h2 className="text-xl font-black text-rose-900 mb-2">
            Diagnostic Failure
          </h2>
          <p className="text-rose-600/70">
            {error?.message || statsError?.message}
          </p>
        </div>
      </div>
    );
  }

  const userName = data?.me?.email.split("@")[0] || "Admin";
  const stats = statsData?.getDashboardStats;

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* 🌟 Welcome & Top Revenue Badge */}
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight text-left">
            Welcome, <span className="text-indigo-600">{userName}</span>! 👋
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-left">
            LuxeLogic Surgical Precision: Clinical Health Overview
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-4 bg-emerald-600 p-4 rounded-3xl text-white shadow-xl shadow-emerald-100/50">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <Banknote size={24} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest leading-none mb-1">
              Total Clinic Balance
            </p>
            <p className="text-2xl font-black leading-none">
              {formatCurrency(stats?.totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* 📊 THE 6 STATS CARDS (GERİ GELDİLER! 💎) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 text-left">
        {/* 1. Appointment Revenue */}
        <div className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-100 group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Banknote size={24} />
            </div>
            <span className="text-purple-500 text-[10px] font-black uppercase bg-purple-50 px-2 py-1 rounded-lg">
              Revenue
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">
            Appointment Revenue
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">
            {formatCurrency(stats?.appointmentRevenue)}
          </p>
        </div>

        {/* 2. Product Revenue */}
        <div className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-100 group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Banknote size={24} />
            </div>
            <span className="text-emerald-500 text-[10px] font-black uppercase bg-emerald-50 px-2 py-1 rounded-lg">
              Revenue
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">
            Product Revenue
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">
            {formatCurrency(stats?.productRevenue)}
          </p>
        </div>

        {/* 3. Total Customers */}
        <div className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-100 group hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
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
            {stats?.customerCount || 0}
          </p>
        </div>

        {/* 4. Appointments */}
        <div className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-100 group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
              <Calendar size={24} />
            </div>
            <span className="text-purple-500 text-[10px] font-black uppercase bg-purple-50 px-2 py-1 rounded-lg tracking-tighter">
              Total
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">
            Appointments
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">
            {stats?.appointmentCount || 0}
          </p>
        </div>

        {/* 5. Active Staff */}
        <div className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
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
            {stats?.staffCount || 0}
          </p>
        </div>

        {/* 6. Total Products */}
        <div className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-100 group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
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
            {stats?.productCount || 0}
          </p>
        </div>
      </div>

      {/* 🏗️ BOTTOM PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-left">
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-50">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Recent Patient Intake
            </h2>
            <button className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">
              View All Logs
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
                    <p className="text-sm text-slate-400 font-medium">
                      New surgical profile created successfully.
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

        <div className="h-fit lg:sticky lg:top-10 bg-linear-to-br from-indigo-600 to-violet-800 p-9 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
          <div className="relative z-10 text-left">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20 shadow-inner">
              <Plus size={32} strokeWidth={2.5} />
            </div>
            <div className="mb-8">
              <h2 className="text-2xl font-black mb-2 tracking-tighter leading-tight">
                Customer Registration
              </h2>
              <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest opacity-80 leading-none">
                Efficiency Starts Here
              </p>
              <p className="text-indigo-50/70 text-xs font-medium mt-4 leading-relaxed">
                Quickly add a new patient to synchronize clinical operations and
                revenue flow.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95"
            >
              Add New Customer 💎
            </button>
          </div>
        </div>
      </div>

      <AddCustomerModal
        key={isAddModalOpen ? "open" : "closed"}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Overview;
