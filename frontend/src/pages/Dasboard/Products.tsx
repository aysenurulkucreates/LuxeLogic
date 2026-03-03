import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
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
import { GET_MY_PRODUCTS } from "../../graphql/queries/auth";
import { DELETE_PRODUCT } from "../../graphql/mutations/products";
import AddProductModal from "../../components/shared/AddProductModal";

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer); // Kullanıcı yazmaya devam ederse eskiyi iptal et!
  }, [searchTerm]);

  const { loading, error, data } = useQuery(GET_MY_PRODUCTS, {
    variables: { searchTerm: debouncedSearchTerm },
  });

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    refetchQueries: [{ query: GET_MY_PRODUCTS }],
    onCompleted: () => alert("Product deleted successfully."),
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product? ")) {
      await deleteProduct({ variables: { id } });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mt-10">
        An error occured: {error.message}
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Search Bar Area */}
      <div className="relative max-w-md mb-8 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search by name..."
          className="block w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-white shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Products
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            Total of
            <span className="text-indigo-600 font-bold">
              {data?.myProducts?.length || 0}
            </span>
            products were found.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-semibold active:scale-95"
        >
          <PackagePlus size={20} />
          Add new product
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-4xl shadow-xl shadow-slate-100/50 border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-5 bg-slate-50/50 px-8 py-5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
          <span className="col-span-2">Product Info</span>
          <span>Category</span>
          <span>Price & Stock</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-slate-50">
          {data?.myProducts?.length > 0 ? (
            data.myProducts.map((product: Product) => (
              <div
                key={product.id}
                className="grid grid-cols-5 px-8 py-6 items-center hover:bg-indigo-50/30 transition-all group"
              >
                <div className="col-span-2 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-base">
                      {product.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{product.id.slice(-6)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                    <LayoutGrid size={14} />
                  </div>
                  {product.category}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-base font-black text-slate-900">
                    <Banknote size={16} className="text-emerald-500" />$
                    {product.price.toLocaleString()}
                  </div>
                  <div
                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${product.stock > 10 ? "text-slate-400" : "text-rose-500"}`}
                  >
                    <Boxes size={12} />
                    {product.stock} in stock
                  </div>
                </div>

                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center flex flex-col items-center gap-4">
              <PackageSearch size={64} className="text-slate-200" />
              <p className="text-slate-400 font-medium">
                No products found. Start by adding one!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Usage */}
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
