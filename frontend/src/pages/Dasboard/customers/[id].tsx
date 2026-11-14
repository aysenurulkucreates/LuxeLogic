import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CUSTOMER } from "../../../graphql/queries/auth";
import { DELETE_CUSTOMER } from "../../../graphql/mutations/customers";
import AddCustomerModal from "../../../components/shared/AddCustomerModal";
import DetailLayout from "../../../components/shared/DetailLayout";
import InfoCard, {
  FieldList,
  FieldRow,
} from "../../../components/detail/InfoCard";
import NotFoundCard from "../../../components/detail/NotFoundCard";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import { useAuth } from "../../../hooks/useAuth";
import { can } from "../../../config/permissions";
import { Contact } from "lucide-react";
import toast from "react-hot-toast";

const linkClasses = "text-indigo-600 hover:text-indigo-700 hover:underline";

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = useAuth().user?.role;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_CUSTOMER, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const customer = data?.getCustomer;

  const [deleteCustomer, { loading: deleteLoading }] = useMutation(
    DELETE_CUSTOMER,
    {
      onCompleted: (result) => {
        if (result?.deleteCustomer?.success === false) {
          toast.error(
            `Could not delete customer: ${result.deleteCustomer.message}`,
          );
          return;
        }
        navigate("/customers");
      },
      onError: (err) =>
        toast.error(`Could not delete customer: ${err.message}`),
    },
  );

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!customer) {
    return (
      <NotFoundCard
        title="Customer not found"
        backLabel="Back to customers"
        backUrl="/customers"
      />
    );
  }

  return (
    <>
      <DetailLayout
        eyebrow="Customer"
        title={customer.name}
        avatar={
          <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl font-semibold">
            {customer.name?.charAt(0).toUpperCase()}
          </div>
        }
        backUrl="/customers"
        onEdit={
          can(role, "customer", "edit") ? () => setIsModalOpen(true) : undefined
        }
        onDelete={
          can(role, "customer", "delete")
            ? () => setConfirmDelete(true)
            : undefined
        }
      >
        <InfoCard title="Contact" icon={Contact}>
          <FieldList>
            <FieldRow label="Email">
              {customer.email ? (
                <a href={`mailto:${customer.email}`} className={linkClasses}>
                  {customer.email}
                </a>
              ) : (
                "—"
              )}
            </FieldRow>
            <FieldRow label="Phone">
              {customer.phone ? (
                <a href={`tel:${customer.phone}`} className={linkClasses}>
                  {customer.phone}
                </a>
              ) : (
                "—"
              )}
            </FieldRow>
          </FieldList>
        </InfoCard>
      </DetailLayout>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this customer?"
        message={
          <p>
            <span className="font-semibold text-slate-900">
              {customer.name}
            </span>{" "}
            will be deleted.
          </p>
        }
        confirmLabel="Delete"
        tone="danger"
        isLoading={deleteLoading}
        onConfirm={async () => {
          await deleteCustomer({ variables: { id } });
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
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
