import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { Link } from "react-router-dom";
import {
  LayoutGrid,
  Banknote,
  Boxes,
  Pencil,
  Trash2,
  PackagePlus,
  PackageSearch,
  Lock,
} from "lucide-react";
import { GET_MY_PRODUCTS } from "../../../graphql/queries/auth";
import AddProductModal from "../../../components/shared/AddProductModal";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import EmptyState from "../../../components/ui/EmptyState";
import { DELETE_PRODUCT } from "../../../graphql/mutations/products";
import toast from "react-hot-toast";
import { useSocket } from "../../../hooks/useSocket";
import { useRecordLock } from "../../../hooks/useRecordLock";

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

  const client = useApolloClient();

  const socket = useSocket();
  const { isLocked, lockRecord, unlockRecord } = useRecordLock(socket);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    loading,
    error,
    data: currentData,
    previousData,
    refetch,
  } = useQuery(GET_MY_PRODUCTS, {
    variables: { searchTerm: debouncedSearchTerm },
  });
  // Yeni arama sonucu gelene kadar önceki listeyi göstermeye devam et
  const data = currentData ?? previousData;
  const isRefreshing = loading && !!data;

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    refetchQueries: [{ query: GET_MY_PRODUCTS }],
    onCompleted: () => toast.success("Product deleted."),
    onError: (err) => toast.error(`Could not delete product: ${err.message}`),
  });

  useEffect(() => {
    const handleCreated = (newProduct: Product) => {
      toast.success(`New product added: ${newProduct.name}`);
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
    };

    const handleDeleted = (deletedId: string) => {
      toast.success("A product was deleted.");
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
    };

    const handleUpdated = (updatedProduct: Product) => {
      toast.success(`${updatedProduct.name} was updated.`);
      refetch();
    };

    const handleSaleCreated = () => {
      toast.success("New sale recorded. Stock levels updated.");
      refetch(); // Stokları tazele!
    };

    // Satış iptal edildiğinde stoğu anında geri artıracak!
    const handleSaleDeleted = () => {
      toast.success("A sale was cancelled. Stock levels updated.");
      refetch(); // Stokları tazele!
    };

    socket.on("product_created", handleCreated);
    socket.on("product_deleted", handleDeleted);
    socket.on("product_updated", handleUpdated);
    socket.on("sale_created", handleSaleCreated);
    socket.on("sale_deleted", handleSaleDeleted);

    return () => {
      socket.off("product_created", handleCreated);
      socket.off("product_deleted", handleDeleted);
      socket.off("product_updated", handleUpdated);
      socket.off("sale_created", handleSaleCreated);
      socket.off("sale_deleted", handleSaleDeleted);
    };
  }, [socket, client, debouncedSearchTerm, refetch]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    lockRecord(product.id);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    unlockRecord(selectedProduct?.id);
    setSelectedProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProduct({ variables: { id } });
    }
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 text-left">
      {/* Başlık, arama ve birincil aksiyon */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">
            Total: {data?.myProducts?.length || 0}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
          />
          <Button icon={PackagePlus} onClick={() => setIsModalOpen(true)}>
            Add product
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-5 bg-slate-50/50 px-10 py-6 border-b border-slate-100 text-xs font-semibold text-slate-500">
          <span className="col-span-2 text-left">Product</span>
          <span className="text-left">Category</span>
          <span className="text-left">Price & stock</span>
          <span className="text-right">Actions</span>
        </div>

        <div
          aria-busy={loading}
          className={`divide-y divide-slate-50 transition-opacity ${isRefreshing ? "opacity-50" : ""}`}
        >
          {!data ? (
            <LoadingState layout="inline" />
          ) : data.myProducts?.length > 0 ? (
            data.myProducts.map((product: Product) => {
              // 🚨 ŞEF CERRAH RADARI: Bu ürün kilitli mi?
              const locked = isLocked(product.id);

              return (
                <div
                  key={product.id}
                  className={`grid grid-cols-5 px-10 py-8 items-center transition-all group ${
                    locked
                      ? "bg-slate-50/50 opacity-60 grayscale-20 pointer-events-none"
                      : "hover:bg-indigo-50/30 bg-white"
                  }`}
                >
                  {/* 🔗 THE CRITICAL LINK: Wrapping Name and Avatar */}
                  <div className="col-span-2">
                    <Link
                      to={`/products/${product.id}`}
                      className={`flex items-center gap-5 w-fit group/link ${locked ? "pointer-events-none" : ""}`}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-semibold text-xl shadow-lg transition-transform duration-300 ${
                          locked
                            ? "bg-slate-300 text-slate-100"
                            : "bg-indigo-600 text-white group-hover/link:scale-110"
                        }`}
                      >
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col text-left">
                        <span
                          className={`font-semibold text-lg transition-colors ${
                            locked
                              ? "text-slate-500"
                              : "text-slate-800 group-hover/link:text-indigo-600"
                          }`}
                        >
                          {product.name}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold mt-1">
                          SKU #{product.id.slice(-6)}
                        </span>
                      </div>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <LayoutGrid size={16} />
                    </div>
                    {product.category}
                  </div>

                  <div className="flex flex-col gap-2 text-left">
                    <div
                      className={`flex items-center gap-2 text-lg font-semibold ${locked ? "text-slate-500" : "text-slate-900"}`}
                    >
                      <Banknote
                        size={18}
                        className={
                          locked ? "text-slate-400" : "text-emerald-500"
                        }
                      />
                      ${product.price.toLocaleString()}
                    </div>
                    <div
                      className={`flex items-center gap-2 text-xs font-semibold ${
                        locked
                          ? "text-slate-400"
                          : product.stock > 10
                            ? "text-slate-400"
                            : "text-rose-600"
                      }`}
                    >
                      <Boxes size={14} />
                      {product.stock} in stock
                    </div>
                  </div>

                  {/* 🚨 KİLİT AKSİYONLARI */}
                  <div
                    className={`flex justify-end gap-3 transition-all duration-300 ${locked ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <button
                      onClick={() => !locked && handleEdit(product)}
                      disabled={locked}
                      className={`p-3 shadow-sm border rounded-lg transition-all ${
                        locked
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100"
                      }`}
                    >
                      {locked ? <Lock size={20} /> : <Pencil size={20} />}
                    </button>
                    <button
                      onClick={() => !locked && handleDelete(product.id)}
                      disabled={locked}
                      className={`p-3 shadow-sm border rounded-lg transition-all ${
                        locked
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100"
                      }`}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              plural="products"
              singular="product"
              icon={PackageSearch}
            />
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
