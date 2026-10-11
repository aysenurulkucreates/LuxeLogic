import {
  Package,
  X,
  PackageSearch,
  LayoutGrid,
  Banknote,
  Boxes,
  PackagePlus,
  Save,
} from "lucide-react";
import Button from "../ui/Button";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import toast from "react-hot-toast";
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
      onError: (err) => toast.error(`Could not add product: ${err.message}`),
    },
  );

  const [updateProduct, { loading: updateLoading }] = useMutation(
    UPDATE_PRODUCT,
    {
      refetchQueries: [{ query: GET_MY_PRODUCTS }],
      onCompleted: () => onClose(),
      onError: (err) => toast.error(`Could not update product: ${err.message}`),
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
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-slate-50 pb-6">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Package size={24} />
            </div>
            {initialData ? "Edit product" : "Add product"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">
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
                className="w-full rounded-lg border border-slate-100 bg-slate-50/50 py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-slate-700"
                placeholder="ex: laser device"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">
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
                className="w-full rounded-lg border border-slate-100 bg-slate-50/50 py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-slate-700"
                placeholder="ex: skincare"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Price */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">
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
                  className="w-full rounded-lg border border-slate-100 bg-slate-50/50 py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700"
                  required
                />
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">
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
                  className="w-full rounded-lg border border-slate-100 bg-slate-50/50 py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            icon={initialData ? Save : PackagePlus}
            isLoading={createLoading || updateLoading}
            className="mt-8 w-full"
          >
            {createLoading || updateLoading
              ? "Saving…"
              : initialData
                ? "Save changes"
                : "Add product"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
