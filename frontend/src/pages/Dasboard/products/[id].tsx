import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GET_PRODUCT } from "../../../graphql/queries/auth";
import { useMutation, useQuery } from "@apollo/client";
import { DELETE_PRODUCT } from "../../../graphql/mutations/products";
import AddProductModal from "../../../components/shared/AddProductModal";
import DetailLayout from "../../../components/shared/DetailLayout";
import StatTile from "../../../components/detail/StatTile";
import InfoCard, {
  FieldList,
  FieldRow,
} from "../../../components/detail/InfoCard";
import StatusBadge, {
  type BadgeTone,
} from "../../../components/detail/StatusBadge";
import NotFoundCard from "../../../components/detail/NotFoundCard";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import { useAuth } from "../../../hooks/useAuth";
import { can } from "../../../config/permissions";
import { formatMoney } from "../../../lib/format";
import { Banknote, Boxes, Package, Tag } from "lucide-react";
import toast from "react-hot-toast";

// Tek eşik: 0 = tükendi, 5'in altı = azalıyor.
const LOW_STOCK_LIMIT = 5;

const getStockState = (
  stock: number,
): { label: string; tone: BadgeTone; hint: string } => {
  if (stock <= 0)
    return {
      label: "Out of stock",
      tone: "danger",
      hint: "This product can't be sold until it is restocked.",
    };
  if (stock < LOW_STOCK_LIMIT)
    return {
      label: "Low stock",
      tone: "warning",
      hint: "Stock is low. Consider restocking soon.",
    };
  return {
    label: "In stock",
    tone: "success",
    hint: "Stock level is sufficient.",
  };
};

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = useAuth().user?.role;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_PRODUCT, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const product = data?.getProduct;

  const [deleteProduct, { loading: deleteLoading }] = useMutation(
    DELETE_PRODUCT,
    {
      onCompleted: (result) => {
        if (result?.deleteProduct?.success === false) {
          toast.error(
            `Could not delete product: ${result.deleteProduct.message}`,
          );
          return;
        }
        navigate("/products");
      },
      onError: (err) => toast.error(`Could not delete product: ${err.message}`),
    },
  );

  if (loading && !data) return <LoadingState />;

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!product) {
    return (
      <NotFoundCard
        title="Product not found"
        backLabel="Back to products"
        backUrl="/products"
      />
    );
  }

  const stock: number = product.stock ?? 0;
  const stockState = getStockState(stock);

  return (
    <>
      <DetailLayout
        eyebrow="Product"
        title={product.name || "Product"}
        badge={
          <StatusBadge tone={stockState.tone}>{stockState.label}</StatusBadge>
        }
        backUrl="/products"
        onEdit={
          can(role, "product", "edit") ? () => setIsModalOpen(true) : undefined
        }
        onDelete={
          can(role, "product", "delete")
            ? () => setConfirmDelete(true)
            : undefined
        }
        stats={[
          <StatTile
            key="price"
            icon={Banknote}
            label="Unit price"
            value={formatMoney(product.price)}
          />,
          <StatTile
            key="stock"
            icon={Boxes}
            label="In stock"
            value={`${stock} ${stock === 1 ? "unit" : "units"}`}
          />,
          <StatTile
            key="category"
            icon={Tag}
            label="Category"
            value={product.category || "General"}
          />,
        ]}
      >
        <InfoCard title="Details" icon={Package}>
          <FieldList>
            <FieldRow label="Name">{product.name}</FieldRow>
            <FieldRow label="Category">
              {product.category || "General"}
            </FieldRow>
            <FieldRow label="Stock value">
              {formatMoney((product.price ?? 0) * stock)}
            </FieldRow>
            <FieldRow label="Stock status">{stockState.hint}</FieldRow>
          </FieldList>
        </InfoCard>
      </DetailLayout>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this product?"
        message={
          <p>
            <span className="font-semibold text-slate-900">{product.name}</span>{" "}
            will be deleted.
          </p>
        }
        confirmLabel="Delete"
        tone="danger"
        isLoading={deleteLoading}
        onConfirm={async () => {
          await deleteProduct({ variables: { id } });
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <AddProductModal
        key={product.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={product}
      />
    </>
  );
};

export default ProductDetailPage;
