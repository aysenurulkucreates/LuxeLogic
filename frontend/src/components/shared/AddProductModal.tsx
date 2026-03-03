import {
  Package,
  X,
  PackageSearch,
  LayoutGrid,
  Banknote,
  Boxes,
} from "lucide-react";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
} from "../../graphql/mutations/products";
import { GET_MY_PRODUCTS } from "../../graphql/queries/auth";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Product | null;
}

interface ProductFormData {
  name: string;
  category: string;
  price: number;
  stock: number;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || "",
    category: initialData?.category || "",
    price: initialData?.price || 0,
    stock: initialData?.stock || 0,
  });

  // --- MUTASYONLAR ---
  const [createProduct, { loading: createLoading }] = useMutation(
    CREATE_PRODUCT,
    {
      refetchQueries: [{ query: GET_MY_PRODUCTS }],
      onCompleted: () => {
        onClose();
        setFormData({
          name: "",
          category: "",
          price: 0,
          stock: 0,
        });
      },
    },
  );

  const [updateProduct, { loading: updateLoading }] = useMutation(
    UPDATE_PRODUCT,
    {
      refetchQueries: [{ query: GET_MY_PRODUCTS }],
      onCompleted: () => onClose(),
    },
  );

  if (!isOpen) return null;

  // --- GÖNDERME MANTIĞI ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData?.id) {
      await updateProduct({
        variables: {
          id: initialData.id,
          input: { ...formData },
        },
      });
    } else {
      await createProduct({
        variables: { input: { ...formData } },
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    // Eğer input tipi 'number' ise (price ve stock gibi), değeri sayıya çeviriyoruz
    const finalValue = type === "number" ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-slate-50 pb-6">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Package size={24} />
            </div>
            {initialData ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              Product Name
            </label>
            <div className="relative">
              <PackageSearch
                className="absolute left-4 top-3.5 text-slate-300"
                size={20}
              />
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-slate-700"
                placeholder="ex: laser device"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              Category
            </label>
            <div className="relative">
              <LayoutGrid
                className="absolute left-4 top-3.5 text-slate-300"
                size={20}
              />
              <input
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-slate-700"
                placeholder="ex: skincare"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Price */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Price ($)
              </label>
              <div className="relative">
                <Banknote
                  className="absolute left-4 top-3.5 text-slate-300"
                  size={20}
                />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700"
                  required
                />
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Stock
              </label>
              <div className="relative">
                <Boxes
                  className="absolute left-4 top-3.5 text-slate-300"
                  size={20}
                />
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createLoading || updateLoading}
            className="mt-8 w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all active:scale-[0.98] flex justify-center items-center gap-3"
          >
            {createLoading || updateLoading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                Processing...
              </>
            ) : (
              <>{initialData ? "Update Product" : "Save Product"}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
