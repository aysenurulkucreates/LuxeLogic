import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Calendar, Filter, Plus } from "lucide-react";
import { GET_MY_SALES } from "../../../graphql/queries/auth";
import { DELETE_SALE } from "../../../graphql/mutations/sales";
import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import AddSaleModal from "../../../components/shared/AddSaleModal";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import EmptyState from "../../../components/ui/EmptyState";
import toast from "react-hot-toast";
import { useAuth } from "../../../hooks/useAuth";
import { useSocket } from "../../../hooks/useSocket";

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
  const client = useApolloClient();

  const userTenantId = user?.tenantId;

  const socket = useSocket(userTenantId);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, loading, error, refetch } = useQuery(GET_MY_SALES, {
    variables: { searchTerm: debouncedSearchTerm },
  });

  const [deleteSale] = useMutation(DELETE_SALE, {
    refetchQueries: [
      {
        query: GET_MY_SALES,
        variables: { searchTerm: debouncedSearchTerm },
      },
    ],
    onCompleted: () => {
      toast.success("Sale deleted.");
    },
    onError: (err) => {
      toast.error(`Could not delete sale: ${err.message}`);
    },
  });

  useEffect(() => {
    const handleCreated = (newSale: Sale) => {
      toast.success(
        `New sale: ${newSale?.quantity}x ${newSale?.product?.name} for ${newSale?.customer?.name || "Guest"}`,
      );
      client.cache.updateQuery(
        {
          query: GET_MY_SALES,
          variables: { searchTerm: debouncedSearchTerm },
        },
        (existingData) => {
          if (!existingData) return null;

          return {
            mySales: [...existingData.mySales, newSale],
          };
        },
      );
    };

    const handleDeleted = (deletedId: string) => {
      toast.error("A sale was cancelled.");
      client.cache.updateQuery(
        {
          query: GET_MY_SALES,
          variables: { searchTerm: debouncedSearchTerm },
        },
        (existingData) => {
          if (!existingData) return null;

          return {
            mySales: existingData.mySales.filter(
              (sale: Sale) => sale.id !== deletedId,
            ),
          };
        },
      );
    };

    socket.on("sale_created", handleCreated);
    socket.on("sale_deleted", handleDeleted);

    return () => {
      socket.off("sale_created", handleCreated);
      socket.off("sale_deleted", handleDeleted);
    };
  }, [socket, client, debouncedSearchTerm]);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to cancel this sale? The stock will be restored.",
    );
    // Hatalar deleteSale'in onError'ında toast ile gösteriliyor
    if (confirmDelete) {
      await deleteSale({ variables: { id } });
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700 text-left">
      {/* Başlık, arama ve birincil aksiyon */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sales</h1>
          <p className="text-sm text-slate-500 mt-1">
            Total: {data?.mySales?.length || 0}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search sales..."
          />
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            New sale
          </Button>
        </div>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden">
        {loading && !data ? (
          <LoadingState layout="inline" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="px-10 py-8">Date</th>
                  <th className="px-10 py-8">Customer</th>
                  <th className="px-10 py-8">Product</th>
                  <th className="px-10 py-8">Quantity</th>
                  <th className="px-10 py-8">Total</th>
                  <th className="px-10 py-8 text-right">Actions</th>
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
                        className="flex items-center gap-2 font-bold text-slate-500 text-sm hover:text-indigo-600 transition-colors"
                      >
                        <Calendar size={14} className="text-indigo-400" />{" "}
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </Link>
                    </td>

                    {/* 🔗 CLIENT LINK (Primary) */}
                    <td className="px-10 py-8">
                      <Link
                        to={`/sales/${sale.id}`}
                        className="font-semibold text-slate-900 text-lg hover:text-indigo-600 transition-colors decoration-indigo-200 hover:underline decoration-2 underline-offset-4"
                      >
                        {sale.customer?.name || "Guest"}
                      </Link>
                    </td>

                    <td className="px-10 py-8 font-bold text-slate-700 text-xs">
                      {sale.product?.name}
                    </td>

                    <td className="px-10 py-8">
                      <span className="bg-slate-100 px-4 py-1.5 rounded-lg text-xs font-semibold">
                        x{sale.quantity}
                      </span>
                    </td>

                    <td className="px-10 py-8 text-xl font-semibold text-indigo-600">
                      ${sale.totalPrice.toLocaleString()}
                    </td>

                    <td className="px-10 py-8 text-right">
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="p-4 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
          <EmptyState plural="sales" singular="sale" icon={Filter} />
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
