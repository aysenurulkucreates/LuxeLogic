import { useState } from "react";
import { Search, Banknote, Trash2, Calendar, Filter, Plus } from "lucide-react"; // 🚨 Plus eklendi
import { GET_MY_SALES } from "../../../graphql/queries/auth";
import { DELETE_SALE } from "../../../graphql/mutations/sales";
import { useQuery, useMutation } from "@apollo/client";
import AddSaleModal from "../../../components/shared/AddSaleModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const { data, loading, error } = useQuery(GET_MY_SALES, {
    variables: { searchTerm },
  });

  const [deleteSale] = useMutation(DELETE_SALE, {
    refetchQueries: [{ query: GET_MY_SALES, variables: { searchTerm } }],
    onCompleted: () => {
      alert("Sale successfully discharged from the system. 💉");
    },
    onError: (err) => {
      alert(`Emergency! Could not delete: ${err.message}`);
    },
  });

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to cancel this sale? Stock will return!",
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
      <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-100 mt-10 font-bold text-center">
        🚨 System Crash: {error.message}
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
              <Banknote size={24} />
            </div>
            Sales History
          </h1>
          <p className="text-slate-400 font-bold mt-1 text-left">
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
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-indigo-600 font-bold text-slate-700 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center font-bold text-slate-400 animate-pulse">
            Scanning clinical records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 uppercase text-[10px] font-black tracking-widest text-slate-400">
                  <th className="px-8 py-6">Date</th>
                  <th className="px-8 py-6">Customer</th>
                  <th className="px-8 py-6">Product</th>
                  <th className="px-8 py-6">Qty</th>
                  <th className="px-8 py-6">Total</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.mySales?.map((sale: Sale) => (
                  <tr
                    key={sale.id}
                    className="group hover:bg-slate-50/50 transition-all"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 font-bold text-slate-500 text-sm">
                        <Calendar size={14} className="text-indigo-400" />{" "}
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-slate-900">
                      {sale.customer?.name || "Walk-in"}
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-700">
                      {sale.product?.name}
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black">
                        x{sale.quantity}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-lg font-black tracking-tighter">
                      ${sale.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
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
        {!loading && data?.mySales?.length === 0 && (
          <div className="py-20 text-center text-slate-400 font-bold">
            <Filter size={40} className="mx-auto mb-4 opacity-20" /> No sales
            found.
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
