import { X, User, Mail, Phone, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_CUSTOMER } from "../../graphql/mutations/customers";
import { GET_MY_CUSTOMERS } from "../../graphql/queries/auth";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
  });

  const [createCustomer, { loading, error }] = useMutation(CREATE_CUSTOMER, {
    refetchQueries: [{ query: GET_MY_CUSTOMERS }], // git bir daha bak komutu, tazeleme için,
    onCompleted: () => {
      onClose();
      setFormData({ name: "", email: "", phone: "" });
    },
  });

  if (!isOpen) return null;

  if (error)
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mt-10">
        An error occured: {error.message}
      </div>
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCustomer({
      variables: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop: Arka planı karartma ve blur efekti */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal İçeriği */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl transform transition-all overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <h3 className="text-xl font-bold text-gray-900">
            New Customer Registration
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* İsim Soyisim */}
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
                type="text"
                name="name"
                required
                placeholder="Ex: Aysenur Ulku"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* E-posta */}
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
                type="email"
                name="email"
                required
                placeholder="ayse@luxelogic.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Telefon */}
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
                type="tel"
                name="phone"
                placeholder="05XX XXX XX XX"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Kaydet Butonu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2"
          >
            <PlusCircle size={20} />
            Add Customer to System
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;
