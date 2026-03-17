import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Banknote, Trash2, Calendar, Filter, Plus } from "lucide-react"; // 🚨 Plus eklendi
import { GET_MY_SALES } from "../../../graphql/queries/auth";
import { DELETE_SALE } from "../../../graphql/mutations/sales";
import { useQuery, useMutation } from "@apollo/client";
import AddSaleModal from "../../../components/shared/AddSaleModal";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../hooks/useAuth";

const socket = io("http://localhost:4000");

// User Interface'i
interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId: string; // İşte altın anahtarımız!
}

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
}
interface Customer {
  id: string;
  name: string;
}
interface Tenant {
  id: string;
  name: string;
}

interface Sale {
  id: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  product: Product;
  customer: Customer;
  tenant: Tenant;
}

const SaleList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const { user } = useAuth() as { user: User | null };

  const userTenantId = user?.tenantId;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, loading, error, refetch } = useQuery(GET_MY_SALES, {
    variables: { searchTerm },
  });

  const [deleteSale] = useMutation(DELETE_SALE, {
    refetchQueries: [
      {
        query: GET_MY_SALES,
        variables: { searchTerm: debouncedSearchTerm },
      },
    ],
    onCompleted: () => {
      toast.success("Sale successfully discharged from the system. 💉");
    },
    onError: (err) => {
      toast.error(`Emergency! Could not delete: ${err.message}`);
    },
  });

  useEffect(() => {
    if (userTenantId) {
      socket.emit("join_tenant_room", userTenantId);
    }

    socket.on("sale_created", (newSale) => {
      toast.success(
        `New transaction: ${newSale?.quantity}x ${newSale?.product?.name} sold to ${newSale?.customer?.name || "Guest"}`,
        {
          icon: "💰",
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        },
      );
      refetch();
    });

    socket.on("sale_deleted", (deletedId) => {
      toast.error(
        `Transaction ${deletedId} cancelled. Stock levels restored! 🔄`,
        {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        },
      );
      refetch();
    });

    return () => {
      socket.off("sale_created");
      socket.off("sale_deleted");
    };
  }, [refetch, userTenantId]);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to cancel this sale? Stock will return! 🚨",
    );
    if (confirmDelete) {
      try {
        await deleteSale({ variables: { id } });
      } catch (e) {
        console.error("Unexpected error:", e);
      }
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  if (error)
    return (
      <div className="p-10 max-w-7xl mx-auto">
        <div className="bg-rose-50 text-rose-600 p-8 rounded-[2.5rem] border border-rose-100 font-black text-center shadow-sm">
          🚨 System Crash: {error.message}
        </div>
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700 text-left">
      <Toaster position="top-right" reverseOrder={false} />
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100">
              <Banknote size={28} />
            </div>
            Sales History
          </h1>
          <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-[0.2em]">
            Monitor clinical revenue and inventory flow.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by client or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-4xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 font-bold text-slate-700 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-5 bg-indigo-600 text-white rounded-[1.8rem] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden">
        {loading ? (
          <div className="p-32 text-center font-black text-slate-400 animate-pulse tracking-widest uppercase text-xs">
            Scanning clinical records... 💉
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 uppercase text-[10px] font-black tracking-[0.2em] text-slate-400">
                  <th className="px-10 py-8">Date</th>
                  <th className="px-10 py-8">Client Identity</th>
                  <th className="px-10 py-8">Asset Sold</th>
                  <th className="px-10 py-8">Qty</th>
                  <th className="px-10 py-8">Total Revenue</th>
                  <th className="px-10 py-8 text-right">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.mySales?.map((sale: Sale) => (
                  <tr
                    key={sale.id}
                    className="group hover:bg-indigo-50/30 transition-all"
                  >
                    {/* 🔗 DATE LINK */}
                    <td className="px-10 py-8">
                      <Link
                        to={`/sales/${sale.id}`}
                        className="flex items-center gap-2 font-bold text-slate-400 text-sm hover:text-indigo-600 transition-colors"
                      >
                        <Calendar size={14} className="text-indigo-400" />{" "}
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </Link>
                    </td>

                    {/* 🔗 CLIENT LINK (Primary) */}
                    <td className="px-10 py-8">
                      <Link
                        to={`/sales/${sale.id}`}
                        className="font-black text-slate-900 text-lg hover:text-indigo-600 transition-colors decoration-indigo-200 hover:underline decoration-2 underline-offset-4"
                      >
                        {sale.customer?.name || "Guest Transaction"}
                      </Link>
                    </td>

                    <td className="px-10 py-8 font-bold text-slate-700 uppercase text-xs tracking-widest">
                      {sale.product?.name}
                    </td>

                    <td className="px-10 py-8">
                      <span className="bg-slate-100 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        x{sale.quantity}
                      </span>
                    </td>

                    <td className="px-10 py-8 text-xl font-black tracking-tight text-indigo-600">
                      ₺{sale.totalPrice.toLocaleString()}
                    </td>

                    <td className="px-10 py-8 text-right">
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="p-4 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-[1.2rem] transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- EMPTY STATE --- */}
        {!loading && data?.mySales?.length === 0 && (
          <div className="py-32 text-center flex flex-col items-center gap-4">
            <div className="p-8 bg-slate-50 rounded-full">
              <Filter size={48} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
              No transaction records detected.✨
            </p>
          </div>
        )}
      </div>

      <AddSaleModal
        key={selectedSale?.id || "new-sale"}
        isOpen={isModalOpen}
        onClose={handleClose}
        initialData={selectedSale}
      />
    </div>
  );
};

export default SaleList;
