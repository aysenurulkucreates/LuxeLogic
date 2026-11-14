import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  GET_APPOINTMENT,
  GET_DASHBOARD_STATS,
  GET_MY_APPOINTMENTS,
} from "../../../graphql/queries/auth";
import {
  DELETE_APPOINTMENT,
  UPDATE_APPOINTMENT_STATUS,
} from "../../../graphql/mutations/appointments";
import AddAppointmentModal from "../../../components/shared/AddAppointmentModal";
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
import {
  canDeleteAppointment,
  canEditAppointment,
  isClosedAppointment,
} from "../../../config/permissions";
import { formatDate, formatMoney, formatTime } from "../../../lib/format";
import {
  Banknote,
  Calendar,
  ClipboardList,
  Clock,
  ListChecks,
  Lock,
  User,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;

const STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  CANCELLED: "danger",
  COMPLETED: "success",
};

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "complete" | "delete" | null
  >(null);

  const { data, loading, error, refetch } = useQuery(GET_APPOINTMENT, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const appointment = data?.getAppointment;

  const [deleteAppointment, { loading: deleteLoading }] = useMutation(
    DELETE_APPOINTMENT,
    {
      onCompleted: (result) => {
        if (result?.deleteAppointment?.success === false) {
          toast.error(
            `Could not delete appointment: ${result.deleteAppointment.message}`,
          );
          return;
        }
        navigate("/appointments");
      },
      onError: (err) =>
        toast.error(`Could not delete appointment: ${err.message}`),
    },
  );

  const [updateAppointmentStatus, { loading: statusLoading }] = useMutation(
    UPDATE_APPOINTMENT_STATUS,
    {
      refetchQueries: [
        { query: GET_MY_APPOINTMENTS },
        { query: GET_DASHBOARD_STATS },
      ],
      onCompleted: () => {
        toast.success("Appointment status updated.");
        refetch();
      },
      onError: (err) => toast.error(`Could not update status: ${err.message}`),
    },
  );

  if (loading && !data) return <LoadingState />;

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!appointment) {
    return (
      <NotFoundCard
        title="Appointment not found"
        backLabel="Back to appointments"
        backUrl="/appointments"
      />
    );
  }

  const status: string = appointment.status || "PENDING";
  const closed = isClosedAppointment(status);
  const canEdit = canEditAppointment(role, status);
  const canDelete = canDeleteAppointment(role, status);

  const handleStatusClick = (newStatus: string) => {
    // Tamamlama geri alınamaz: önce onay iste
    if (newStatus === "COMPLETED") {
      setPendingAction("complete");
      return;
    }
    updateAppointmentStatus({ variables: { id, status: newStatus } });
  };

  const handleConfirm = async () => {
    if (pendingAction === "complete") {
      await updateAppointmentStatus({
        variables: { id, status: "COMPLETED" },
      });
    } else if (pendingAction === "delete") {
      await deleteAppointment({ variables: { id } });
    }
    setPendingAction(null);
  };

  return (
    <>
      <DetailLayout
        eyebrow="Appointment"
        title={appointment.customer?.name || "Appointment"}
        badge={
          <StatusBadge tone={STATUS_TONE[status] ?? "neutral"}>
            {status}
          </StatusBadge>
        }
        backUrl="/appointments"
        onEdit={canEdit ? () => setIsModalOpen(true) : undefined}
        onDelete={canDelete ? () => setPendingAction("delete") : undefined}
        stats={[
          <StatTile
            key="date"
            icon={Calendar}
            label="Date"
            value={formatDate(appointment.startTime)}
          />,
          <StatTile
            key="time"
            icon={Clock}
            label="Time"
            value={`${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}`}
          />,
          <StatTile
            key="fee"
            icon={Banknote}
            label="Fee"
            value={formatMoney(appointment.price)}
          />,
          <StatTile
            key="staff"
            icon={UserRound}
            label="Staff"
            value={appointment.staff?.name || "Unassigned"}
          />,
        ]}
        aside={
          <InfoCard title="Status" icon={ListChecks}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((option) => {
                  const isCurrent = status === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleStatusClick(option)}
                      disabled={statusLoading || isCurrent || closed}
                      aria-pressed={isCurrent}
                      className={`py-2 rounded-lg text-xs font-semibold transition-colors border ${
                        isCurrent
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : closed
                            ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {closed && (
                <p className="flex items-start gap-2 text-sm text-slate-600">
                  <Lock size={16} className="shrink-0 mt-0.5 text-slate-500" />
                  This appointment is completed. Its status can no longer
                  change, and only a clinic admin can edit it.
                </p>
              )}
            </div>
          </InfoCard>
        }
      >
        <InfoCard title="Customer" icon={User}>
          <FieldList>
            <FieldRow label="Name">
              {appointment.customer?.id ? (
                <Link
                  to={`/customers/${appointment.customer.id}`}
                  className="text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  {appointment.customer.name}
                </Link>
              ) : (
                "—"
              )}
            </FieldRow>
            <FieldRow label="Email">
              {appointment.customer?.email || "—"}
            </FieldRow>
            <FieldRow label="Phone">
              {appointment.customer?.phone || "—"}
            </FieldRow>
          </FieldList>
        </InfoCard>

        <InfoCard title="Notes" icon={ClipboardList}>
          {appointment.notes ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {appointment.notes}
            </p>
          ) : (
            <p className="text-sm text-slate-500">No notes added.</p>
          )}
        </InfoCard>
      </DetailLayout>

      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction === "complete"
            ? "Mark this appointment as completed?"
            : "Delete this appointment?"
        }
        message={
          pendingAction === "complete" ? (
            <>
              <p>
                Fee:{" "}
                <span className="font-semibold text-slate-900">
                  {formatMoney(appointment.price)}
                </span>
              </p>
              <p>After this, only a clinic admin can edit it.</p>
            </>
          ) : (
            <p>This appointment will be permanently deleted.</p>
          )
        }
        confirmLabel={
          pendingAction === "complete" ? "Mark as completed" : "Delete"
        }
        tone={pendingAction === "delete" ? "danger" : "primary"}
        isLoading={statusLoading || deleteLoading}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />

      <AddAppointmentModal
        key={appointment.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={appointment}
      />
    </>
  );
};

export default AppointmentDetailPage;
