import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CUSTOMER } from "../../../graphql/queries/auth";
import { DELETE_CUSTOMER } from "../../../graphql/mutations/customers";
import AddCustomerModal from "../../../components/shared/AddCustomerModal";
import DetailLayout from "../../../components/shared/DetailLayout";
import { Mail, Phone } from "lucide-react";

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error } = useQuery(GET_CUSTOMER, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const customer = data?.getCustomer;

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    onCompleted: () => navigate("/customers"),
  });

  if (loading)
    return (
      <div className="p-20 text-indigo-600 font-black">
        Resuscitating data... 💉
      </div>
    );
  if (error)
    return (
      <div className="p-20 text-rose-600 font-bold">
        🚨 System Failure: {error.message}
      </div>
    );

  if (!customer) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-black text-slate-800">
          No patient file found! 🔍
        </h1>
        <p className="text-slate-500 mb-4">ID: {id}</p>
        <button
          onClick={() => navigate("/customers")}
          className="bg-slate-100 px-6 py-2 rounded-xl font-bold"
        >
          ← Back to Directory
        </button>
      </div>
    );
  }

  return (
    <>
      <DetailLayout
        title={customer.name}
        backUrl="/customers"
        onEdit={() => setIsModalOpen(true)}
        onDelete={() => {
          if (window.confirm("Delete this patient?"))
            deleteCustomer({ variables: { id } });
        }}
        // 👤 SOL TARAF: PROFIL (Sadece sendeki veriler!)
        profileSlot={
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 text-left">
            <div className="w-20 h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black mx-auto lg:mx-0">
              {customer.name.charAt(0)}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600 font-medium">
                <Mail size={18} className="text-slate-400" /> {customer.email}
              </div>
              <div className="flex items-center gap-3 text-slate-600 font-medium">
                <Phone size={18} className="text-slate-400" /> {customer.phone}
              </div>
            </div>
          </div>
        }
        // 🏥 ANA BÖLGE: GENEL BİLGİLER
        mainContentSlot={
          <div className="space-y-6 text-left">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Patient File Summary
            </h2>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-sm text-slate-500 font-bold uppercase mb-2">
                Internal System ID
              </p>
              <code className="text-indigo-600 font-mono text-sm">
                {customer.id}
              </code>
              <p className="text-sm text-slate-500 font-bold uppercase mt-4 mb-2">
                Tenant Association
              </p>
              <code className="text-slate-600 font-mono text-sm">
                {customer.tenantId}
              </code>
            </div>
          </div>
        }
      />

      <AddCustomerModal
        key={customer.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={customer}
      />
    </>
  );
};

export default CustomerDetailPage;
