import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GET_SALE } from "../../../graphql/queries/auth";
import { DELETE_SALE } from "../../../graphql/mutations/sales";
import AddSaleModal from "../../../components/shared/AddSaleModal";
import DetailLayout from "../../../components/shared/DetailLayout";
import {
  Receipt,
  ShoppingCart,
  Banknote,
  CreditCard,
  User,
  Mail,
  Phone,
  Database,
} from "lucide-react";

const SaleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error } = useQuery(GET_SALE, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const sale = data?.getSale;

  const [deleteSale] = useMutation(DELETE_SALE, {
    onCompleted: () => navigate("/sales"),
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="text-indigo-600 font-black animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Resuscitating data... 💉
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="p-10 bg-white rounded-[2.5rem] shadow-xl border border-rose-100 text-rose-600 font-bold text-center">
          <p className="text-4xl mb-4">🚨</p>
          System Failure: {error.message}
        </div>
      </div>
    );

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-20 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100">
          <h1 className="text-3xl font-black text-slate-800 mb-2">
            No file found! 🔍
          </h1>
          <button
            onClick={() => navigate("/appointments")}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg"
          >
            ← Back to Directory
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <DetailLayout
        // 💎 HEADER: Transaction Identity
        title={sale.product?.name || "Sale Detail"}
        backUrl="/sales"
        onEdit={() => setIsModalOpen(true)}
        onDelete={() => {
          if (
            window.confirm(
              "Are you sure you want to permanently void this transaction? 🚨",
            )
          )
            deleteSale({ variables: { id } });
        }}
        // 👤 LEFT SIDE: Transaction Summary & Audit
        profileSlot={
          <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden text-left sticky top-8">
            <div className="bg-indigo-600 p-8 text-white space-y-4">
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Receipt size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">Sale Record</h3>
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">
                  Validated Transaction
                </p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                  Transaction Date
                </p>
                <p className="font-bold text-slate-700 text-lg">
                  {sale.createdAt
                    ? new Date(sale.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "---"}
                </p>
              </div>
              <div className="group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                  Order Quantity
                </p>
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-lg">
                  <ShoppingCart size={18} />
                  {sale.quantity} Units
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Completed
                </div>
              </div>
            </div>
          </div>
        }
        // 📊 TOP STATS: Financial Metrics
        statsSlot={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between text-left group hover:border-indigo-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Revenue Generated
                </p>
                <p className="text-3xl font-black text-indigo-600 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(sale.totalPrice || 0)}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                <Banknote size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between text-left group hover:border-indigo-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Unit Price (Avg)
                </p>
                <p className="text-xl font-black text-slate-800 mt-1 font-mono uppercase">
                  ${(sale.totalPrice / sale.quantity).toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:scale-110 transition-transform">
                <CreditCard size={24} />
              </div>
            </div>
          </div>
        }
        // 🏥 MAIN CONTENT: Transaction Dossier
        mainContentSlot={
          <div className="space-y-10 text-left">
            {/* Section 1: Product Details */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">
                Inventory Link
              </p>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                  {sale.product?.name}
                  <span className="text-slate-300 font-light mx-4">/</span>
                  <span className="text-slate-400">
                    ID #{sale.id?.slice(-6)}
                  </span>
                </h2>
                <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                  {sale.product?.category || "General"}
                </span>
              </div>
            </div>

            {/* Section 2: Customer Identity Grid */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                  <User size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Client Information
                </h2>
              </div>
              {sale.customer ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Client Name
                    </p>
                    <p className="font-bold text-slate-800 text-xl">
                      {sale.customer.name}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Mail size={16} className="text-slate-400" />
                      <p className="text-sm font-bold">{sale.customer.email}</p>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone size={16} className="text-slate-400" />
                      <p className="text-sm font-bold">{sale.customer.phone}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic font-medium">
                  Guest Transaction - No customer data recorded.
                </p>
              )}
            </div>

            {/* Section 3: System Audit Notes */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-900/10 space-y-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="bg-white/10 p-3 rounded-2xl text-indigo-400">
                  <Database size={20} />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  System Audit & Tenant Metadata
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                <div>
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">
                    Tenant Authority
                  </p>
                  <p className="text-slate-300 font-mono text-sm uppercase">
                    #{sale.tenant?.id?.slice(0, 12)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">
                    Operational ID
                  </p>
                  <p className="text-slate-300 font-mono text-sm uppercase">
                    #{sale.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <AddSaleModal
        key={sale.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={sale}
      />
    </div>
  );
};

export default SaleDetailPage;
