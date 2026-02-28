import { X, User, Mail, Phone, PlusCircle, Save } from "lucide-react";
import { useState } from "react"; // useEffect'i sildik bbeiş!
import { useMutation } from "@apollo/client";
import {
  CREATE_CUSTOMER,
  UPDATE_CUSTOMER,
} from "../../graphql/mutations/customers";
import { GET_MY_CUSTOMERS } from "../../graphql/queries/auth";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Customer | null;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  // --- 1. SİHİRLİ DOKUNUŞ: State'i direkt initialData ile başlatıyoruz ---
  const [formData, setFormData] = useState<CustomerFormData>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
  });

  // --- MUTASYONLAR ---
  const [createCustomer, { loading: createLoading }] = useMutation(
    CREATE_CUSTOMER,
    {
      refetchQueries: [{ query: GET_MY_CUSTOMERS }],
      onCompleted: () => {
        onClose();
        setFormData({ name: "", email: "", phone: "" });
      },
    },
  );

  const [updateCustomer, { loading: updateLoading }] = useMutation(
    UPDATE_CUSTOMER,
    {
      refetchQueries: [{ query: GET_MY_CUSTOMERS }],
      onCompleted: () => onClose(),
    },
  );

  if (!isOpen) return null;

  // --- GÖNDERME MANTIĞI ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData?.id) {
      await updateCustomer({
        variables: {
          id: initialData.id,
          ...formData,
        },
      });
    } else {
      await createCustomer({
        variables: { ...formData },
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <h3 className="text-xl font-bold text-gray-900">
            {initialData
              ? "Update Customer Profile"
              : "New Customer Registration"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Customer Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                name="name"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                name="email"
                required
                type="email"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Telephone Number
            </label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                name="phone"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createLoading || updateLoading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
          >
            {initialData ? <Save size={20} /> : <PlusCircle size={20} />}
            {initialData ? "Save Changes" : "Add Customer to System"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;
