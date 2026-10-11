import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CUSTOMER } from "../../../graphql/queries/auth";
import { DELETE_CUSTOMER } from "../../../graphql/mutations/customers";
import AddCustomerModal from "../../../components/shared/AddCustomerModal";
import DetailLayout from "../../../components/shared/DetailLayout";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import Button from "../../../components/ui/Button";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import toast from "react-hot-toast";

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_CUSTOMER, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const customer = data?.getCustomer;

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    onCompleted: () => navigate("/customers"),
    onError: (err) => toast.error(`Could not delete customer: ${err.message}`),
  });

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!customer) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            Customer not found
          </h1>
          <p className="text-sm text-slate-500">ID: {id}</p>
          <Button icon={ArrowLeft} onClick={() => navigate("/customers")}>
            Back to customers
          </Button>
        </div>
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
          if (window.confirm("Are you sure you want to delete this customer?"))
            deleteCustomer({ variables: { id } });
        }}
        // 👤 SOL TARAF: PROFIL (Sadece sendeki veriler!)
        profileSlot={
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6 text-left">
            <div className="w-20 h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-semibold mx-auto lg:mx-0">
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
            <h2 className="text-lg font-semibold text-slate-900">
              Summary
            </h2>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-500 font-bold mb-2">
                Customer ID
              </p>
              <code className="text-indigo-600 font-mono text-sm">
                {customer.id}
              </code>
              <p className="text-sm text-slate-500 font-bold mt-4 mb-2">
                Tenant ID
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
