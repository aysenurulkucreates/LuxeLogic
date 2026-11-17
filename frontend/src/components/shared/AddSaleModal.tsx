import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CREATE_SALE } from "../../graphql/mutations/sales";
import {
  GET_MY_SALES,
  GET_MY_CUSTOMERS,
  GET_MY_PRODUCTS,
} from "../../graphql/queries/auth";
import { Banknote, X, ShoppingBag, Package, User, Hash } from "lucide-react";
import LoadingState from "../ui/LoadingState";
import toast from "react-hot-toast";
import Button from "../ui/Button";

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

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SaleFormData {
  quantity: number;
  customerId: string;
  productId: string;
}

const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: productData, loading: prodLoading } = useQuery(
    GET_MY_PRODUCTS,
    {
      variables: { searchTerm: debouncedSearchTerm },
      skip: !isOpen,
    },
  );

  const { data: customerData, loading: custLoading } = useQuery(
    GET_MY_CUSTOMERS,
    {
      variables: { searchTerm: debouncedSearchTerm },
      skip: !isOpen,
    },
  );

  // totalPrice artık state'te yok
  const [formData, setFormData] = useState<SaleFormData>({
    quantity: 1,
    customerId: "",
    productId: "",
  });

  // Toplam her render'da seçili ürün × miktar'dan hesaplanıyor (sadece gösterim için;
  // gerçek tutarı sunucu hesaplıyor)
  const selectedProduct = productData?.myProducts?.find(
    (p: Product) => p.id === formData.productId,
  );
  const total = selectedProduct
    ? Number(selectedProduct.price) * formData.quantity
    : 0;

  const [createSale, { loading: createLoading }] = useMutation(CREATE_SALE, {
    refetchQueries: [{ query: GET_MY_SALES }],
    onCompleted: () => {
      toast.success("Sale completed. Inventory updated!");
      onClose();
    },
    onError: (err) => toast.error(`Could not complete sale: ${err.message}`),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.productId) {
      toast.error("Please select a customer and a product.");
      return;
    }

    await createSale({
      variables: {
        input: {
          productId: formData.productId,
          customerId: formData.customerId,
          quantity: Number(formData.quantity), // totalPrice gönderilmiyor
        },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-left">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        {/* 🌟 MODAL HEADER */}
        <div className="bg-indigo-600 p-8 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <ShoppingBag size={28} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">New Sale</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {((prodLoading && !productData) || (custLoading && !customerData)) && (
          <LoadingState layout="inline" />
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            {/* SEARCH */}
            <input
              type="text"
              placeholder="Search products or customers..."
              className="w-full p-4 bg-slate-50 border-none rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* PRODUCT SELECT */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center gap-2">
                <Package size={14} /> Product
              </label>
              <select
                name="productId"
                className="w-full p-4 bg-slate-50 border-none rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all"
                value={formData.productId}
                onChange={(e) =>
                  setFormData({ ...formData, productId: e.target.value })
                }
                required
              >
                <option value="">Choose product...</option>
                {productData?.myProducts?.map((p: Product) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            {/* CUSTOMER SELECT */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center gap-2">
                <User size={14} /> Customer
              </label>
              <select
                name="customerId"
                className="w-full p-4 bg-slate-50 border-none rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all"
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
                required
              >
                <option value="">Select customer...</option>
                {customerData?.myCustomers?.map((c: Customer) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 📊 QUANTITY & TOTAL (Side by Side) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center gap-2">
                <Hash size={14} /> Qty
              </label>
              <input
                type="number"
                min="1"
                className="w-full p-4 bg-slate-50 border-none rounded-lg font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all"
                value={isNaN(formData.quantity) ? "" : formData.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFormData({ ...formData, quantity: isNaN(val) ? 0 : val });
                }}
              />
            </div>

            {/* Değiştirilemeyen toplam: ürünün fiyatı × miktar */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-emerald-600 ml-1 flex items-center gap-2">
                <Banknote size={14} /> Total
              </label>
              <div className="w-full p-4 bg-emerald-50 rounded-lg font-semibold text-emerald-700">
                {selectedProduct ? `$${total.toFixed(2)}` : "—"}
              </div>
            </div>
          </div>

          {/* 💎 ACTION BUTTONS */}
          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-lg transition-all"
            >
              Cancel
            </button>
            <Button
              type="submit"
              icon={ShoppingBag}
              isLoading={createLoading}
              className="flex-2"
            >
              {createLoading ? "Saving…" : "Complete sale"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSaleModal;
