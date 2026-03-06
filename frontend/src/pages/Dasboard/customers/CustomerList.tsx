import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_MY_CUSTOMERS } from "../../../graphql/queries/auth";
import { DELETE_CUSTOMER } from "../../../graphql/mutations/customers";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import AddCustomerModal from "../../../components/shared/AddCustomerModal";

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
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { loading, error, data } = useQuery(GET_MY_CUSTOMERS, {
    variables: { searchTerm: debouncedSearchTerm },
  });

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    refetchQueries: [{ query: GET_MY_CUSTOMERS }],
    onCompleted: () =>
      alert("Customer successfully discharged from the system."),
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
    if (
      window.confirm(
        "Are you sure you want to delete this customer? This record will be permanently lost!",
      )
    ) {
      await deleteCustomer({ variables: { id } });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-100 mt-10 font-bold">
        🚨 System Error: {error.message}
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* 🔍 Search & Actions Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div className="relative max-w-md w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search customers by name or email..."
            className="block w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-black active:scale-95"
        >
          <UserPlus size={20} />
          Add New Customer
        </button>
      </div>

      {/* 📊 Header Section */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest flex items-center gap-2">
            <Users size={16} className="text-indigo-500" />
            Total Registered:
            <span className="text-indigo-600">
              {data?.myCustomers?.length || 0}
            </span>
          </p>
        </div>
      </div>

      {/* 🏗️ The "Luxe" Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-4 bg-slate-50/80 px-10 py-6 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span>Customer Identity</span>
          <span>Contact Information</span>
          <span>Status</span>
          <span className="text-right">Management</span>
        </div>

        <div className="divide-y divide-slate-50">
          {data?.myCustomers?.length > 0 ? (
            data.myCustomers.map((customer: Customer) => (
              <div
                key={customer.id}
                className="grid grid-cols-4 px-10 py-8 items-center hover:bg-indigo-50/20 transition-all group"
              >
                {/* 👤 Identity Section */}
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-lg leading-none mb-1">
                      {customer.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {customer.id.slice(-6)}
                    </span>
                  </div>
                </div>

                {/* ✉️ Communication Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <Mail size={14} />
                    </div>
                    {customer.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <Phone size={14} />
                    </div>
                    {customer.phone}
                  </div>
                </div>

                {/* ✨ Status Section */}
                <div>
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-tighter">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Verified
                  </span>
                </div>

                {/* ⚙️ Actions Section */}
                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="p-3.5 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-3.5 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            /* 🏜️ Empty State */
            <div className="py-32 text-center flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-2">
                <Search size={48} />
              </div>
              <p className="text-slate-400 font-black text-xl">
                No customers found.
              </p>
              <p className="text-slate-300 text-sm max-w-xs">
                Try adjusting your filters or add your first patient to the
                clinic registry.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 Modal Integration with "Key" trick */}
      <AddCustomerModal
        key={selectedCustomer?.id || "new-customer"}
        isOpen={isModalOpen}
        onClose={handleClose}
        initialData={selectedCustomer}
      />
    </div>
  );
};

export default CustomerList;
