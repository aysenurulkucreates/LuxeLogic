import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  UserPlus,
  Mail,
  Phone,
  MoreVertical,
  Trash2,
  Pencil,
  Search,
} from "lucide-react";
import { GET_MY_CUSTOMERS } from "../../../graphql/queries/auth";
import AddCustomerModal from "../../../components/shared/AddCustomerModal";
import { DELETE_CUSTOMER } from "../../../graphql/mutations/customers";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const CustomerList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms (Yarım saniye) bekleme süresi

    return () => clearTimeout(timer); // Kullanıcı yazmaya devam ederse eskiyi iptal et!
  }, [searchTerm]);

  const { loading, error, data } = useQuery(GET_MY_CUSTOMERS, {
    variables: { searchTerm: debouncedSearchTerm },
  });

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    refetchQueries: [{ query: GET_MY_CUSTOMERS }],
    onCompleted: () => alert("Customer deleted successfully."),
  });

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this customer? ")) {
      await deleteCustomer({ variables: { id } });
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
    <div className="p-8">
      <div className="relative max-w-md mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Her harfte anlık state güncellenir
        />
      </div>
      {/* Üst Başlık ve Aksiyon Alanı */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Customers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Total of {data?.myCustomers?.length || 0} customers were found.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm font-medium"
        >
          <UserPlus size={18} />
          Add new customer
        </button>
      </div>

      {/* Liste Konteynırı */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-4 bg-gray-50 px-6 py-4 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Customer</span>
          <span>Communication</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-gray-50">
          {data?.myCustomers.map((customer: Customer) => (
            <div
              key={customer.id}
              className="grid grid-cols-4 px-6 py-4 items-center hover:bg-indigo-50/30 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  {customer.name.charAt(0)}
                </div>
                <span className="font-semibold text-gray-900">
                  {customer.name}
                </span>
              </div>

              <div className="flex flex-col gap-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  {customer.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  {customer.phone}
                </div>
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Active
                </span>
              </div>

              <div className="text-right flex justify-end gap-2">
                {/* 1. DÜZENLE BUTONU (PENCIL) */}
                <button
                  onClick={() => handleEdit(customer)} //
                  className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-indigo-600 transition"
                  title="Edit Customer"
                >
                  <Pencil size={20} />
                </button>

                {/* 2. SİLME BUTONU (TRASH) */}
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition"
                  title="Delete Customer"
                >
                  <Trash2 size={20} />
                </button>

                <button className="p-2 hover:bg-white rounded-lg text-gray-400 transition">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. MODAL KULLANIMI (GÜNCELLENDİ) */}
      <AddCustomerModal
        key={selectedCustomer?.id || "new"}
        isOpen={isModalOpen}
        onClose={handleClose}
        initialData={selectedCustomer}
      />
    </div>
  );
};

export default CustomerList;
