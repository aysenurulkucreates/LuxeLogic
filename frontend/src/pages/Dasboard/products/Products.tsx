import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { Link } from "react-router-dom";
import {
  Search,
  LayoutGrid,
  Banknote,
  Boxes,
  Pencil,
  Trash2,
  PackagePlus,
  PackageSearch,
} from "lucide-react";
import { GET_MY_PRODUCTS } from "../../../graphql/queries/auth";
import AddProductModal from "../../../components/shared/AddProductModal";
import { DELETE_PRODUCT } from "../../../graphql/mutations/products";
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
  category: string;
  price: number;
  stock: number;
}

const ProductList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { user } = useAuth() as { user: User | null };
  const client = useApolloClient();

  const userTenantId = user?.tenantId;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { loading, error, data, refetch } = useQuery(GET_MY_PRODUCTS, {
    variables: { searchTerm: debouncedSearchTerm },
  });

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    refetchQueries: [{ query: GET_MY_PRODUCTS }],
    onCompleted: () => toast.success("Product deleted successfully."),
  });

  useEffect(() => {
    if (userTenantId) {
      socket.emit("join_tenant_room", userTenantId);
    }

    socket.on("product_created", (newProduct) => {
      toast.success(`New product created: ${newProduct.name}`, {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      client.cache.updateQuery(
        {
          query: GET_MY_PRODUCTS,
          variables: { searchTerm: debouncedSearchTerm },
        },
        (existingData) => {
          if (!existingData) return null;

          return {
            myProducts: [...existingData.myProducts, newProduct],
          };
        },
      );
    });

    socket.on("product_deleted", (deletedId) => {
      toast.success("Product successfully removed from the inventory. 🗑️", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      client.cache.updateQuery(
        {
          query: GET_MY_PRODUCTS,
          variables: { searchTerm: debouncedSearchTerm },
        },
        (existingData) => {
          if (!existingData) return null;

          return {
            myProducts: existingData.myProducts.filter(
              (product: Product) => product.id !== deletedId,
            ),
          };
        },
      );
    });

    socket.on("product_updated", (updatedProduct) => {
      toast.success(`Product ${updatedProduct.name} successfully updated`, {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      refetch();
    });

    socket.on("sale_created", () => {
      toast.success("A sale was just made! Stock levels updating... 💸", {
        icon: "📉",
      });
      refetch(); // Stokları tazele!
    });

    // Satış iptal edildiğinde stoğu anında geri artıracak!
    socket.on("sale_deleted", () => {
      toast.success("A sale was cancelled! Stock levels restored... 🔄", {
        icon: "📈",
      });
      refetch(); // Stokları tazele!
    });

    return () => {
      socket.off("product_created");
      socket.off("product_deleted");
      socket.off("product_updated");
      socket.off("sale_created");
      socket.off("sale_deleted");
    };
  }, [client, debouncedSearchTerm, refetch, userTenantId]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product? 🚨")) {
      await deleteProduct({ variables: { id } });
    }
  };

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-indigo-600 font-black">Scanning Inventory... 💉</p>
      </div>
    );

  if (error)
    return (
      <div className="p-10 max-w-7xl mx-auto">
        <div className="bg-rose-50 text-rose-600 p-6 rounded-3xl border border-rose-100 font-bold">
          🚨 System Failure: {error.message}
        </div>
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 text-left">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Search Bar Area */}
      <div className="relative max-w-md mb-12 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search products by name..."
          className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Inventory <span className="text-indigo-600">Assets</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
            Total Items:{" "}
            <span className="text-indigo-600">
              {data?.myProducts?.length || 0}
            </span>
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-black uppercase text-xs tracking-widest active:scale-95"
        >
          <PackagePlus size={18} />
          Add New Asset
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-5 bg-slate-50/50 px-10 py-6 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span className="col-span-2 text-left">Product Identity</span>
          <span className="text-left">Category</span>
          <span className="text-left">Market Metrics</span>
          <span className="text-right">Operation</span>
        </div>

        <div className="divide-y divide-slate-50">
          {data?.myProducts?.length > 0 ? (
            data.myProducts.map((product: Product) => (
              <div
                key={product.id}
                className="grid grid-cols-5 px-10 py-8 items-center hover:bg-indigo-50/30 transition-all group"
              >
                {/* 🔗 THE CRITICAL LINK: Wrapping Name and Avatar */}
                <div className="col-span-2">
                  <Link
                    to={`/products/${product.id}`}
                    className="flex items-center gap-5 w-fit group/link"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg group-hover/link:scale-110 transition-transform duration-300">
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-black text-slate-800 text-lg group-hover/link:text-indigo-600 transition-colors">
                        {product.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                        SKU #{product.id.slice(-6)}
                      </span>
                    </div>
                  </Link>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                    <LayoutGrid size={16} />
                  </div>
                  {product.category}
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                    <Banknote size={18} className="text-emerald-500" />₺
                    {product.price.toLocaleString()}
                  </div>
                  <div
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                      product.stock > 10 ? "text-slate-400" : "text-rose-600"
                    }`}
                  >
                    <Boxes size={14} />
                    {product.stock} in stock
                  </div>
                </div>

                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-3 bg-white shadow-sm border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-3 bg-white shadow-sm border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-32 text-center flex flex-col items-center gap-6">
              <div className="p-8 bg-slate-50 rounded-full">
                <PackageSearch size={64} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                No inventory detected.✨
              </p>
            </div>
          )}
        </div>
      </div>

      <AddProductModal
        key={selectedProduct?.id || "new"}
        isOpen={isModalOpen}
        onClose={handleClose}
        initialData={selectedProduct}
      />
    </div>
  );
};

export default ProductList;
