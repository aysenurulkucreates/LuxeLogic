import { useNavigate, useParams } from "react-router-dom";
import { GET_STAFF } from "../../../graphql/queries/auth";
import { useMutation, useQuery } from "@apollo/client";
import { DELETE_STAFF } from "../../../graphql/mutations/staff";
import AddStaffModal from "../../../components/shared/AddStaffModal";
import DetailLayout from "../../../components/shared/DetailLayout";
import StatTile from "../../../components/detail/StatTile";
import InfoCard, {
  FieldList,
  FieldRow,
} from "../../../components/detail/InfoCard";
import StatusBadge from "../../../components/detail/StatusBadge";
import NotFoundCard from "../../../components/detail/NotFoundCard";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import { useAuth } from "../../../hooks/useAuth";
import { can } from "../../../config/permissions";
import { useState } from "react";
import {
  Award,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Contact,
} from "lucide-react";
import toast from "react-hot-toast";

const linkClasses = "text-indigo-600 hover:text-indigo-700 hover:underline";

// StaffList'teki rol adlarıyla aynı
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "System Architect",
  TENANT_ADMIN: "Clinic Manager",
  DOCTOR: "Doctor / Specialist",
  NURSE: "Nurse / Assistant",
  STAFF: "Secretary / Reception",
};

const StaffDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = useAuth().user?.role;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_STAFF, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const staff = data?.getStaff;

  const [deleteStaff, { loading: deleteLoading }] = useMutation(DELETE_STAFF, {
    onCompleted: (result) => {
      if (result?.deleteStaff?.success === false) {
        toast.error(`Could not delete staff: ${result.deleteStaff.message}`);
        return;
      }
      navigate("/staff");
    },
    onError: (err) => toast.error(`Could not delete staff: ${err.message}`),
  });

  if (loading && !data) return <LoadingState />;

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!staff) {
    return (
      <NotFoundCard
        title="Staff member not found"
        backLabel="Back to staff"
        backUrl="/staff"
      />
    );
  }

  const workDays: string[] = staff.workDays ?? [];

  return (
    <>
      <DetailLayout
        eyebrow="Staff member"
        title={staff.name || "Staff member"}
        avatar={
          staff.imageUrl ? (
            <img
              src={staff.imageUrl}
              alt=""
              className="h-12 w-12 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl font-semibold">
              {staff.name?.charAt(0).toUpperCase()}
            </div>
          )
        }
        badge={
          <StatusBadge tone={staff.isActive ? "success" : "neutral"}>
            {staff.isActive ? "Active" : "Inactive"}
          </StatusBadge>
        }
        backUrl="/staff"
        onEdit={
          can(role, "staff", "edit") ? () => setIsModalOpen(true) : undefined
        }
        onDelete={
          can(role, "staff", "delete")
            ? () => setConfirmDelete(true)
            : undefined
        }
        stats={[
          <StatTile
            key="role"
            icon={Briefcase}
            label="Role"
            value={ROLE_LABELS[staff.role] ?? staff.role ?? "—"}
          />,
          <StatTile
            key="expertise"
            icon={Award}
            label="Expertise"
            value={staff.expertise || "—"}
          />,
          <StatTile
            key="days"
            icon={CalendarDays}
            label="Work days"
            value={`${workDays.length} per week`}
          />,
        ]}
        aside={
          <InfoCard title="Contact" icon={Contact}>
            <FieldList>
              <FieldRow label="Email">
                {staff.email ? (
                  <a href={`mailto:${staff.email}`} className={linkClasses}>
                    {staff.email}
                  </a>
                ) : (
                  "—"
                )}
              </FieldRow>
              <FieldRow label="Phone">
                {staff.phone ? (
                  <a href={`tel:${staff.phone}`} className={linkClasses}>
                    {staff.phone}
                  </a>
                ) : (
                  "—"
                )}
              </FieldRow>
            </FieldList>
          </InfoCard>
        }
      >
        <InfoCard title="Work days" icon={CalendarDays}>
          {workDays.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {workDays.map((day) => (
                <li
                  key={day}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100"
                >
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No work days assigned.</p>
          )}
        </InfoCard>

        <InfoCard title="Bio" icon={ClipboardList}>
          {staff.bio ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {staff.bio}
            </p>
          ) : (
            <p className="text-sm text-slate-500">No bio added yet.</p>
          )}
        </InfoCard>
      </DetailLayout>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this staff member?"
        message={
          <p>
            <span className="font-semibold text-slate-900">{staff.name}</span>{" "}
            will be deactivated.
          </p>
        }
        confirmLabel="Delete"
        tone="danger"
        isLoading={deleteLoading}
        onConfirm={async () => {
          await deleteStaff({ variables: { id } });
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <AddStaffModal
        key={staff.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={staff}
      />
    </>
  );
};

export default StaffDetailPage;
