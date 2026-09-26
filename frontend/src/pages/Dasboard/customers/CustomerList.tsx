import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
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
  Lock,
} from "lucide-react";
import AddCustomerModal from "../../../components/shared/AddCustomerModal";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useSocket } from "../../../hooks/useSocket";
import { useRecordLock } from "../../../hooks/useRecordLock";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId: string;
}

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

  const { user } = useAuth() as { user: User | null };
  const client = useApolloClient();
  const userTenantId = user?.tenantId;

  const socket = useSocket(userTenantId);
  //  Telsizden gelen kilitli hasta ID'lerini tutan radar hafızamız
  const { isLocked, lockRecord, unlockRecord } = useRecordLock(
    socket,
    userTenantId,
    user?.email,
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    loading,
    error,
    data: currentData,
    previousData,
    refetch,
  } = useQuery(GET_MY_CUSTOMERS, {
    variables: { searchTerm: debouncedSearchTerm },
  });
  // Yeni arama sonucu gelene kadar önceki listeyi göstermeye devam et
  const data = currentData ?? previousData;
  const isRefreshing = loading && !!data;

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    refetchQueries: [{ query: GET_MY_CUSTOMERS }],
    onCompleted: () =>
      toast.success("Customer successfully discharged from the system."),
    onError: (err) => toast.error(`Could not delete customer: ${err.message}`),
  });

  useEffect(() => {
    const handleCreated = (newCustomer: Customer) => {
      toast.success(`New customer arrived: ${newCustomer.name}`, {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      client.cache.updateQuery(
        {
          query: GET_MY_CUSTOMERS,
          variables: { searchTerm: debouncedSearchTerm },
        },
        (existingData) => {
          if (!existingData) return null;
          return { myCustomers: [...existingData.myCustomers, newCustomer] };
        },
      );
    };

    const handleDeleted = (deletedId: string) => {
      toast.error(`A customer has been removed from the system.`);
      client.cache.updateQuery(
        {
          query: GET_MY_CUSTOMERS,
          variables: { searchTerm: debouncedSearchTerm },
        },
        (existingData) => {
          if (!existingData) return null;
          return {
            myCustomers: existingData.myCustomers.filter(
              (customer: Customer) => customer.id !== deletedId,
            ),
          };
        },
      );
    };

    const handleUpdated = (updatedCustomer: Customer) => {
      toast.success(`${updatedCustomer.name}'s profile has been updated!`, {
        icon: "✨",
      });
      refetch();
    };

    socket.on("customer_created", handleCreated);
    socket.on("customer_deleted", handleDeleted);
    socket.on("customer_updated", handleUpdated);

    // 🚨 Temizliği unutmuyoruz: paylaşılan bağlantıda sadece kendi dinleyicilerimizi kaldırıyoruz
    return () => {
      socket.off("customer_created", handleCreated);
      socket.off("customer_deleted", handleDeleted);
      socket.off("customer_updated", handleUpdated);
    };
  }, [socket, client, debouncedSearchTerm, refetch]);

  //  Düzenleme başlayınca telsize fısılda!
  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);

    // Telsiz Anonsu: "Ben bu dosyayı ameliyata aldım, kitleyin!"
    lockRecord(customer.id);
  };

  //  Modal kapanınca telsizden kilidi aç!
  const handleClose = () => {
    setIsModalOpen(false);

    // Telsiz Anonsu: "Ameliyat bitti, dosyayı serbest bırakın."
    unlockRecord(selectedCustomer?.id);

    setSelectedCustomer(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      await deleteCustomer({ variables: { id } });
    }
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Arama ve Buton Kısmı */}
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

      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest flex items-center gap-2">
            <Users size={16} className="text-indigo-500" />
            Total Registered:{" "}
            <span className="text-indigo-600">
              {data?.myCustomers?.length || 0}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-4 bg-slate-50/80 px-10 py-6 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span>Customer Identity</span>
          <span>Contact Information</span>
          <span>Status</span>
          <span className="text-right">Management</span>
        </div>

        <div
          aria-busy={loading}
          className={`divide-y divide-slate-50 transition-opacity ${isRefreshing ? "opacity-50" : ""}`}
        >
          {!data ? (
            <LoadingState layout="inline" />
          ) : data.myCustomers?.length > 0 ? (
            data.myCustomers.map((customer: Customer) => {
              //  Radar kontrolü! Bu hasta şu an kilitli mi?
              const locked = isLocked(customer.id);

              return (
                <div
                  key={customer.id}
                  // Eğer kilitliyse arka planı soluklaştırıyoruz, değilse normal hover efekti
                  className={`grid grid-cols-4 px-10 py-8 items-center transition-all group ${
                    locked
                      ? "bg-slate-50/50 opacity-60 grayscale-20"
                      : "hover:bg-indigo-50/20"
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left">
                      <Link
                        to={`/customers/${customer.id}`}
                        className={`font-bold text-lg leading-none mb-1 transition-colors ${
                          locked
                            ? "text-slate-500 pointer-events-none"
                            : "text-slate-800 hover:text-indigo-600 cursor-pointer"
                        }`}
                      >
                        {customer.name}
                      </Link>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {customer.id.slice(-6)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400">
                        <Mail size={14} />
                      </div>
                      {customer.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400">
                        <Phone size={14} />
                      </div>
                      {customer.phone}
                    </div>
                  </div>

                  {/*  Kilitliyse ekranda Kırmızı Kilit gösteriyoruz! */}
                  <div>
                    {locked ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-tighter">
                        <Lock size={12} />
                        Editing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-tighter">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Verified
                      </span>
                    )}
                  </div>

                  {/*  Kilitliyse Kalem butonunu pasif yapıyoruz! */}
                  <div
                    className={`flex justify-end gap-3 transition-all duration-300 ${locked ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <button
                      onClick={() => !locked && handleEdit(customer)}
                      disabled={locked}
                      className={`p-3.5 shadow-sm border rounded-2xl transition-all ${
                        locked
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200"
                      }`}
                    >
                      {locked ? <Lock size={18} /> : <Pencil size={18} />}
                    </button>

                    <button
                      onClick={() => !locked && handleDelete(customer.id)}
                      disabled={locked}
                      className={`p-3.5 shadow-sm border rounded-2xl transition-all ${
                        locked
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-200"
                      }`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
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
