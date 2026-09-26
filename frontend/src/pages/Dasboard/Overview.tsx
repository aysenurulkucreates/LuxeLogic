import { useQuery } from "@apollo/client";
import {
  GET_ME,
  GET_DASHBOARD_STATS,
  GET_RECENT_CUSTOMERS,
} from "../../graphql/queries/auth";
import { useState } from "react";
import AddCustomerModal from "../../components/shared/AddCustomerModal";
import ErrorState from "../../components/ui/ErrorState";
import LoadingState from "../../components/ui/LoadingState";
import Button from "../../components/ui/Button";
import { Users, Plus, User } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// Tüm istatistik kartlarının ortak yapısı: üstte etiket, altında değer
const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="h-full bg-white p-6 rounded-2xl border border-slate-200">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
  </div>
);

const Overview: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { loading, error, data, refetch } = useQuery(GET_ME);
  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery(GET_DASHBOARD_STATS);
  const { data: recentData, loading: recentLoading } =
    useQuery(GET_RECENT_CUSTOMERS);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);
  };

  if (
    (loading && !data) ||
    (statsLoading && !statsData) ||
    (recentLoading && !recentData)
  ) {
    return <LoadingState />;
  }

  if (error || statsError) {
    return (
      <ErrorState
        error={error || statsError}
        onRetry={() => {
          refetch();
          refetchStats();
        }}
      />
    );
  }

  const userName = data?.me?.email.split("@")[0] || "Admin";
  const stats = statsData?.getDashboardStats;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-8 text-left">
        <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {userName}.</p>
      </div>

      {/* Toplam bakiye: diğer kartlarla aynı stil, tek başına geniş kart */}
      <div className="mb-6 text-left">
        <StatCard
          label="Total balance"
          value={formatCurrency(stats?.totalRevenue)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 text-left">
        <StatCard
          label="Appointment revenue"
          value={formatCurrency(stats?.appointmentRevenue)}
        />
        <StatCard
          label="Product revenue"
          value={formatCurrency(stats?.productRevenue)}
        />
        <StatCard label="Customers" value={stats?.customerCount || 0} />
        <StatCard label="Appointments" value={stats?.appointmentCount || 0} />
        <StatCard label="Active staff" value={stats?.staffCount || 0} />
        <StatCard label="Products" value={stats?.productCount || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Recent customers
          </h2>
          {recentData?.getRecentCustomers?.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {recentData.getRecentCustomers.map((customer: Customer) => (
                <li
                  key={customer.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {customer.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        New customer added
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No recent customers.</p>
          )}
        </div>

        <div className="h-fit lg:sticky lg:top-10 bg-white p-6 rounded-2xl border border-slate-200 text-left">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-6">
            <Users size={24} />
          </div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Add a customer
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Register a new customer to start booking appointments and sales.
            </p>
          </div>
          <Button
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
            className="w-full"
          >
            Add customer
          </Button>
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
