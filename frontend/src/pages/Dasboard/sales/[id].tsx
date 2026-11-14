import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GET_SALE } from "../../../graphql/queries/auth";
import { DELETE_SALE } from "../../../graphql/mutations/sales";
import DetailLayout from "../../../components/shared/DetailLayout";
import StatTile from "../../../components/detail/StatTile";
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
import { formatDate, formatMoney } from "../../../lib/format";
import {
  Banknote,
  Calendar,
  Package,
  ShoppingCart,
  Tag,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

const linkClasses = "text-indigo-600 hover:text-indigo-700 hover:underline";

const SaleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = useAuth().user?.role;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_SALE, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const sale = data?.getSale;

  const [deleteSale, { loading: deleteLoading }] = useMutation(DELETE_SALE, {
    onCompleted: (result) => {
      if (result?.deleteSale?.success === false) {
        toast.error(`Could not delete sale: ${result.deleteSale.message}`);
        return;
      }
      navigate("/sales");
    },
    onError: (err) => toast.error(`Could not delete sale: ${err.message}`),
  });

  if (loading && !data) return <LoadingState />;

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!sale) {
    return (
      <NotFoundCard
        title="Sale not found"
        backLabel="Back to sales"
        backUrl="/sales"
      />
    );
  }

  const quantity: number = sale.quantity ?? 0;

  return (
    <>
      <DetailLayout
        eyebrow="Sale"
        title={sale.product?.name || "Sale"}
        backUrl="/sales"
        onDelete={
          can(role, "sale", "delete") ? () => setConfirmDelete(true) : undefined
        }
        stats={[
          <StatTile
            key="total"
            icon={Banknote}
            label="Total"
            value={formatMoney(sale.totalPrice)}
          />,
          <StatTile
            key="quantity"
            icon={ShoppingCart}
            label="Quantity"
            value={`${quantity} ${quantity === 1 ? "unit" : "units"}`}
          />,
          <StatTile
            key="unit"
            icon={Tag}
            label="Unit price"
            value={quantity > 0 ? formatMoney(sale.totalPrice / quantity) : "—"}
          />,
          <StatTile
            key="date"
            icon={Calendar}
            label="Date"
            value={formatDate(sale.createdAt)}
          />,
        ]}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <InfoCard title="Product" icon={Package}>
            <FieldList>
              <FieldRow label="Name">
                {sale.product?.id ? (
                  <Link
                    to={`/products/${sale.product.id}`}
                    className={linkClasses}
                  >
                    {sale.product.name}
                  </Link>
                ) : (
                  "—"
                )}
              </FieldRow>
              <FieldRow label="Category">
                {sale.product?.category || "General"}
              </FieldRow>
            </FieldList>
          </InfoCard>

          <InfoCard title="Customer" icon={User}>
            {sale.customer ? (
              <FieldList>
                <FieldRow label="Name">
                  <Link
                    to={`/customers/${sale.customer.id}`}
                    className={linkClasses}
                  >
                    {sale.customer.name}
                  </Link>
                </FieldRow>
                <FieldRow label="Email">{sale.customer.email || "—"}</FieldRow>
                <FieldRow label="Phone">{sale.customer.phone || "—"}</FieldRow>
              </FieldList>
            ) : (
              <p className="text-sm text-slate-500">
                Guest sale – no customer recorded.
              </p>
            )}
          </InfoCard>
        </div>
      </DetailLayout>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this sale?"
        message={
          <p>
            This sale will be deleted and {quantity}{" "}
            {quantity === 1 ? "unit" : "units"} returned to stock.
          </p>
        }
        confirmLabel="Delete"
        tone="danger"
        isLoading={deleteLoading}
        onConfirm={async () => {
          await deleteSale({ variables: { id } });
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
};

export default SaleDetailPage;
