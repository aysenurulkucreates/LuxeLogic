import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  GET_MY_APPOINTMENTS,
  GET_DASHBOARD_STATS,
} from "../../../graphql/queries/auth";
import {
  DELETE_APPOINTMENT,
  UPDATE_APPOINTMENT_STATUS,
} from "../../../graphql/mutations/appointments";
import {
  CalendarClock,
  Pencil,
  Trash2,
  User,
  Banknote,
  Lock,
} from "lucide-react";
import AddAppointmentModal from "../../../components/shared/AddAppointmentModal";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import EmptyState from "../../../components/ui/EmptyState";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useSocket } from "../../../hooks/useSocket";
import { useRecordLock } from "../../../hooks/useRecordLock";

// --- INTERFACES (Pırlanta Tipler) ---
interface Staff {
  id: string;
  name: string;
  email?: string;
  expertise?: string;
}
interface Customer {
  id: string;
  name: string;
}
interface Tenant {
  id: string;
  name: string;
}
// User Interface'i
interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId: string; // İşte altın anahtarımız!
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
  notes?: string;
  customer: Customer;
  staff: Staff;
  tenant: Tenant;
}

const AppointmentList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const socket = useSocket();
  // kilit hafızası
  const { isLocked, lockRecord, unlockRecord } = useRecordLock(socket);

  // --- SEARCH DEBOUNCE (Sızıntı Önleyici 💉) ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- QUERIES ---
  const {
    loading: listLoading,
    error: listError,
    data: currentData,
    previousData,
    refetch,
  } = useQuery(GET_MY_APPOINTMENTS, {
    variables: { input: { searchTerm: debouncedSearchTerm || "" } },
    fetchPolicy: "cache-and-network",
  });
  // Yeni arama sonucu gelene kadar önceki kartları göstermeye devam et
  const data = currentData ?? previousData;
  const isRefreshing = listLoading && !!data;

  // --- MUTATIONS ---
  const [deleteAppointment, { loading: deleteLoading }] = useMutation(
    DELETE_APPOINTMENT,
    {
      refetchQueries: [{ query: GET_MY_APPOINTMENTS }],
      onCompleted: () => toast.success("Appointment deleted."),
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
      onCompleted: () => toast.success("Appointment status updated."),
      onError: (err) => toast.error(`Could not update status: ${err.message}`),
    },
  );

  useEffect(() => {
    const handleAppointmentsChanged = () => {
      refetch();
    };

    const handleStaffDeleted = () => {
      toast.success("A staff member was deactivated. Appointments updated.");
      refetch();
    };

    socket.on("appointment_created", handleAppointmentsChanged);
    socket.on("appointment_updated", handleAppointmentsChanged);
    socket.on("appointment_status_updatedted", handleAppointmentsChanged);
    socket.on("appointment_deleted", handleAppointmentsChanged);
    socket.on("staff_deleted", handleStaffDeleted);

    return () => {
      socket.off("appointment_created", handleAppointmentsChanged);
      socket.off("appointment_updated", handleAppointmentsChanged);
      socket.off("appointment_status_updated", handleAppointmentsChanged);
      socket.off("appointment_deleted", handleAppointmentsChanged);
      socket.off("staff_deleted", handleStaffDeleted);
    };
  }, [socket, refetch]);

  // --- HANDLERS ---
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    await updateAppointmentStatus({ variables: { id, status: newStatus } });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      await deleteAppointment({ variables: { id } });
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
    lockRecord(appointment.id);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    unlockRecord(selectedAppointment?.id);
    setSelectedAppointment(null);
  };

  // --- ERROR STATE  ---
  if (listError) return <ErrorState error={listError} onRetry={refetch} />;

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-500 text-left">
      {/* Başlık, arama ve birincil aksiyon */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Appointments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Total: {data?.myAppointments?.length || 0}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search appointments..."
          />
          <Button icon={CalendarClock} onClick={() => setIsModalOpen(true)}>
            New appointment
          </Button>
        </div>
      </div>

      {/* --- 🩺 GRID: Randevu Kartları --- */}
      <div
        aria-busy={listLoading}
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity ${isRefreshing ? "opacity-50" : ""}`}
      >
        {/* 📋 RANDEVU DÖNGÜSÜ */}
        {data?.myAppointments?.map((app: Appointment) => {
          const locked = isLocked(app.id);
          return (
            <div
              key={app.id}
              className={`rounded-2xl p-8 shadow-sm border transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-32.5 ${
                locked
                  ? "bg-slate-50/50 opacity-60 grayscale-20 border-slate-200 pointer-events-none"
                  : "bg-white border-slate-100 hover:shadow-xl hover:-translate-y-1 group"
              }`}
            >
              {/* 🏷️ STATUS BADGE */}
              <div className="absolute top-6 right-6">
                {locked ? (
                  <span className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold shadow-sm">
                    <Lock size={12} />
                    Editing…
                  </span>
                ) : (
                  <span
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${
                      app.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : app.status === "CONFIRMED"
                          ? "bg-blue-100 text-blue-700"
                          : app.status === "CANCELLED"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {app.status}
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {/* 🔗 DATE LINK: Tarihe tıklayınca detaya! */}
                <Link
                  to={`/appointments/${app.id}`}
                  className={`block w-fit ${locked ? "pointer-events-none" : ""}`}
                >
                  <div
                    className={`flex items-center gap-3 font-bold px-4 py-2 rounded-lg transition-colors ${
                      locked
                        ? "bg-slate-100 text-slate-500"
                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    }`}
                  >
                    <CalendarClock size={20} />
                    <span className="text-sm">
                      {new Date(app.startTime).toLocaleDateString()} @{" "}
                      {new Date(app.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </Link>

                {/* PATIENT & STAFF INFO */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 text-left">
                      Customer
                    </p>
                    <Link
                      to={`/appointments/${app.id}`}
                      className={locked ? "pointer-events-none" : ""}
                    >
                      <h3
                        className={`text-2xl font-semibold leading-tight text-left truncate transition-colors decoration-2 underline-offset-4 ${
                          locked
                            ? "text-slate-500"
                            : "text-slate-800 hover:text-indigo-600 hover:underline decoration-indigo-200"
                        }`}
                      >
                        {app.customer?.name}
                      </h3>
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 text-left">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <User
                        size={18}
                        className={
                          locked ? "text-slate-400" : "text-indigo-500"
                        }
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">
                        Assigned Staff
                      </p>
                      <p
                        className={`text-sm font-bold ${locked ? "text-slate-500" : "text-slate-700"}`}
                      >
                        {app.staff?.name || "Unassigned"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 💸 PRICE BADGE */}
                <div
                  className={`flex items-center justify-between p-4 rounded-2xl border ${
                    locked
                      ? "bg-slate-50 border-slate-100"
                      : "bg-emerald-50/50 border-emerald-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Banknote
                      size={16}
                      className={locked ? "text-slate-400" : "text-emerald-600"}
                    />
                    <span
                      className={`text-xs font-semibold ${locked ? "text-slate-400" : "text-emerald-600"}`}
                    >
                      Fee
                    </span>
                  </div>
                  <span
                    className={`text-xl font-semibold ${locked ? "text-slate-500" : "text-emerald-700"}`}
                  >
                    ${app.price || 0}
                  </span>
                </div>
              </div>

              {/* 💎 ACTION PANEL: Butonlar */}
              <div className="pt-6 space-y-4 border-t border-slate-50">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 text-left">
                    Update Status
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(app.id, status);
                          }}
                          // 🚨 ŞEF CERRAH DOKUNUŞU 3: Kilitliyse butonları da kilitliyoruz!
                          disabled={
                            statusLoading || app.status === status || locked
                          }
                          className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                            app.status === status && !locked
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                              : locked
                                ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200"
                          }`}
                        >
                          {status}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    icon={locked ? Lock : Pencil}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!locked) handleEdit(app);
                    }}
                    disabled={locked}
                    className="flex-1"
                  >
                    {locked ? "Locked" : "Edit"}
                  </Button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!locked) handleDelete(app.id);
                    }}
                    disabled={deleteLoading || locked}
                    className={`px-4 rounded-lg transition-colors border ${
                      locked
                        ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                        : "bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100"
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- İLK YÜKLEME: sadece kart alanında --- */}
      {!data && <LoadingState layout="inline" />}

      {/* --- 🚨 EMPTY STATE --- */}
      {data?.myAppointments?.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100">
          <EmptyState
            plural="appointments"
            singular="appointment"
            icon={CalendarClock}
          />
        </div>
      )}

      {/* --- ➕ MODAL --- */}
      <AddAppointmentModal
        key={selectedAppointment?.id || "new-appointment"}
        isOpen={isModalOpen}
        onClose={handleClose}
        initialData={selectedAppointment}
      />
    </div>
  );
};

export default AppointmentList;
