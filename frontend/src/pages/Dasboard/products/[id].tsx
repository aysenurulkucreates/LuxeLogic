import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GET_PRODUCT } from "../../../graphql/queries/auth";
import { useMutation, useQuery } from "@apollo/client";
import { DELETE_PRODUCT } from "../../../graphql/mutations/products";
import AddProductModal from "../../../components/shared/AddProductModal";
import DetailLayout from "../../../components/shared/DetailLayout";
import {
  Banknote,
  ClipboardList,
  Database,
  Layers,
  Tag,
  Package,
} from "lucide-react";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error } = useQuery(GET_PRODUCT, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const product = data?.getProduct;

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    onCompleted: () => navigate("/products"),
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

  if (!product) {
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
        title={product.customer?.name || "Product Detail"}
        backUrl="/products"
        onEdit={() => setIsModalOpen(true)}
        onDelete={() => {
          if (
            window.confirm("Are you sure you want to delete this product? 🚨")
          )
            deleteProduct({ variables: { id } });
        }}
        // 👤 LEFT SIDE: Product Identity Summary
        profileSlot={
          <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden text-left sticky top-8">
            <div className="bg-indigo-600 p-8 text-white space-y-2">
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Package size={24} />
              </div>
              <h3 className="text-xl font-black pt-2">Product Assets</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                  Catalog Entry
                </p>
                <p className="font-bold text-slate-700 text-lg">
                  {product.createdAt
                    ? new Date(product.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "---"}
                </p>
              </div>
              <div className="group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                  Category
                </p>
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-lg">
                  <Tag size={16} />
                  {product.category || "General"}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                    product.stock > 10
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : product.stock > 0
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-rose-50 text-rose-600 border border-rose-100"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full animate-pulse ${product.stock > 10 ? "bg-emerald-500" : "bg-amber-500"}`}
                  />
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </div>
              </div>
            </div>
          </div>
        }
        // 📊 TOP STATS: Market & Inventory Metrics
        statsSlot={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between text-left group hover:border-indigo-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Unit Price
                </p>
                <p className="text-3xl font-black text-indigo-600 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(product.price || 0)}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                <Banknote size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between text-left group hover:border-indigo-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Current Inventory
                </p>
                <p className="text-3xl font-black text-slate-800 mt-1">
                  {product.stock || 0}{" "}
                  <span className="text-sm font-bold text-slate-400 uppercase">
                    Units
                  </span>
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:scale-110 transition-transform">
                <Layers size={24} />
              </div>
            </div>
          </div>
        }
        // 🏥 MAIN CONTENT: The Product File
        mainContentSlot={
          <div className="space-y-10 text-left">
            {/* Product Identity Header */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">
                Inventory Management
              </p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                {product.name}
                <span className="text-slate-300 font-light mx-4">/</span>
                <span className="text-slate-400">
                  SKU #{product.id?.slice(-6)}
                </span>
              </h2>
            </div>

            {/* Distribution Info */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                  <Database size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Supply Chain Details
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tenant ID
                  </p>
                  <p className="font-bold text-slate-800 text-xl font-mono">
                    {product.tenantId}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Asset Category
                  </p>
                  <p className="font-bold text-slate-700 text-xl">
                    {product.category}
                  </p>
                </div>
              </div>
            </div>

            {/* Internal Specifications (replacing Clinical Notes) */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-900/10 space-y-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="bg-white/10 p-3 rounded-2xl text-indigo-400">
                  <ClipboardList size={20} />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Stock Distribution Insights
                </h2>
              </div>
              <div className="bg-white/5 p-8 rounded-4xl border border-white/5">
                <p className="text-slate-300 text-lg leading-relaxed italic font-medium">
                  {product.stock < 5
                    ? "⚠️ Critical inventory level detected. Restock procedure should be initiated immediately."
                    : "Product inventory levels are stable within the current tenant ecosystem. 💎"}
                </p>
              </div>
            </div>
          </div>
        }
      />

      <AddProductModal
        key={product.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={product}
      />
    </div>
  );
};

export default ProductDetailPage;
