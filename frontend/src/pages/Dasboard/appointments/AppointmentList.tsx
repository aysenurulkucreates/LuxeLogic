import { useMutation, useQuery, useApolloClient } from "@apollo/client";
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
  Search,
  Trash2,
  User,
  Banknote,
  AlertCircle,
  Lock,
} from "lucide-react";
import AddAppointmentModal from "../../../components/shared/AddAppointmentModal";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../hooks/useAuth";

const socket = io("http://localhost:4000");

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

  // kilit hafızası
  const [lockedRecords, setLockedRecords] = useState<string[]>([]);

  const { user } = useAuth() as { user: User | null };
  const client = useApolloClient();

  const userTenantId = user?.tenantId;

  // --- SEARCH DEBOUNCE (Sızıntı Önleyici 💉) ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- QUERIES ---
  const {
    loading: listLoading,
    error: listError,
    data,
    refetch,
  } = useQuery(GET_MY_APPOINTMENTS, {
    variables: { input: { searchTerm: debouncedSearchTerm || "" } },
    fetchPolicy: "cache-and-network",
  });

  // --- MUTATIONS ---
  const [deleteAppointment, { loading: deleteLoading }] = useMutation(
    DELETE_APPOINTMENT,
    {
      refetchQueries: [{ query: GET_MY_APPOINTMENTS }],
      onCompleted: () =>
        toast.success(
          "Vital record successfully discharged from the system. 💉",
        ),
      onError: (err) => alert(`Emergency! Could not delete: ${err.message}`),
    },
  );

  const [updateAppointmentStatus, { loading: statusLoading }] = useMutation(
    UPDATE_APPOINTMENT_STATUS,
    {
      refetchQueries: [
        { query: GET_MY_APPOINTMENTS },
        { query: GET_DASHBOARD_STATS },
      ],
      onCompleted: () =>
        toast.success("Clinic records synchronized. Revenue updated! 💰✨"),
      onError: (err) =>
        toast.error(
          `Diagnostic Error! Could not update status: ${err.message}`,
        ),
    },
  );

  useEffect(() => {
    if (userTenantId) {
      socket.emit("join_tenant_room", userTenantId);
    }

    socket.on("appointment_created", (newAppointment) => {
      // 🚨 YENİ: console.log yerine ekrandan süzülen Toast bildirimi!
      toast.success(
        `New appointment arrived: ${newAppointment.customer?.name}`,
        {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        },
      );
      client.cache.updateQuery(
        {
          query: GET_MY_APPOINTMENTS,
          variables: { searchTerm: debouncedSearchTerm },
        },
        (existingData) => {
          if (!existingData) return null;

          return {
            myAppointments: [...existingData.myAppointments, newAppointment],
          };
        },
      );
    });

    socket.on("appointment_deleted", (deletedId) => {
      // 🚨 YENİ: Silinme için kırmızı hata bildirimi
      toast.error(
        `An appointment ${deletedId} , has been removed from the system.`,
      );
      client.cache.updateQuery(
        {
          query: GET_MY_APPOINTMENTS,
          variables: { searchTerm: debouncedSearchTerm },
        },
        (existingData) => {
          if (!existingData) return null;

          return {
            myAppointments: existingData.myAppointments.filter(
              (appointment: Appointment) => appointment.id !== deletedId,
            ),
          };
        },
      );
    });

    socket.on("appointment_updated", (updatedAppointment) => {
      // 🚨 DÜZELTME: Artık paketi açıp hastanın adını (customer.name) kullanıyoruz!
      toast.success(
        `${updatedAppointment?.customer?.name || "A patient"}'s appointment details have been updated!`,
        {
          icon: "✨",
        },
      );
      refetch();
    });

    socket.on("staff_deleted", (deletedId) => {
      toast.success(
        `A staff ${deletedId} member was removed. Updating appointment records... 🔄  `,
        {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        },
      );
      refetch();
    });

    socket.on("record_locked", ({ recordId }) => {
      setLockedRecords((prev) => [...prev, recordId]);
    });

    socket.on("record_unlocked", ({ recordId }) => {
      setLockedRecords((prev) => prev.filter((id) => id !== recordId));
    });

    // TEMİZLİK: Bileşen ekrandan kalkarsa kulaklığı çıkarıyoruz (Hafıza sızıntısını önler)
    return () => {
      socket.off("appointment_created");
      socket.off("appointment_deleted");
      socket.off("appointment_updated");
      socket.off("staff_deleted");
      socket.off("record_locked");
      socket.off("record_unlocked");
    };
  }, [client, debouncedSearchTerm, refetch, userTenantId]);

  // --- HANDLERS ---
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    await updateAppointmentStatus({ variables: { id, status: newStatus } });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure? This vital record will be lost! 🚨")) {
      await deleteAppointment({ variables: { id } });
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);

    if (userTenantId) {
      socket.emit("lock_record", {
        tenantId: user.tenantId,
        recordId: appointment.id,
        userEmail: user?.email || "Staff",
      });
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);

    if (selectedAppointment?.id && userTenantId) {
      socket.emit("unlock_record", {
        tenantId: userTenantId,
        recordId: selectedAppointment.id,
      });
    }

    setSelectedAppointment(null);
  };

  // --- ERROR STATE  ---
  if (listError)
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-rose-50 border-2 border-dashed border-rose-200 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-300">
          <div className="bg-white p-6 rounded-full shadow-xl shadow-rose-100/50">
            <AlertCircle size={60} className="text-rose-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-rose-900 tracking-tight">
              System Error! 🚨
            </h2>
            <p className="text-rose-600/80 font-medium max-w-md mx-auto">
              Diagnostic Code:
              <span className="font-mono bg-rose-100 px-2 py-1 rounded">
                {listError.message}
              </span>
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95"
          >
            Attempt Resuscitation 💉
          </button>
        </div>
      </div>
    );

  if (listLoading && !data)
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500 text-left">
      <Toaster position="top-right" reverseOrder={false} />
      {/* --- 🩺 HEADER: Arama ve Başlık Bölgesi --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-left">
            Appointment
            <span className="text-indigo-600">Operation Center</span>
          </h1>
          <p className="text-slate-500 font-medium text-left">
            Manage all operations with surgical precision✨
          </p>
        </div>
        <div className="relative group w-full md:w-96">
          <input
            type="text"
            placeholder="Search staff or patient..."
            className="pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl w-full focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            <Search size={24} />
          </div>
        </div>
      </div>

      {/* --- 🩺 GRID: Randevu Kartları --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* ➕ YENİ RANDEVU BUTONU */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-4 hover:bg-indigo-50 hover:border-indigo-400 transition-all group min-h-130"
        >
          <div className="bg-white p-5 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300">
            <CalendarClock className="text-indigo-600 w-10 h-10" />
          </div>
          <div className="text-center">
            <span className="block font-black text-xl text-indigo-700">
              New Appointment
            </span>
            <span className="text-indigo-400 text-sm font-medium">
              Add a new operation to queue
            </span>
          </div>
        </button>

        {/* 📋 RANDEVU DÖNGÜSÜ */}
        {data?.myAppointments?.map((app: Appointment) => {
          const isLocked = lockedRecords.includes(app.id);
          return (
            <div
              key={app.id}
              className={`rounded-[2.5rem] p-8 shadow-sm border transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-32.5 ${
                isLocked
                  ? "bg-slate-50/50 opacity-60 grayscale-20 border-slate-200 pointer-events-none"
                  : "bg-white border-slate-100 hover:shadow-xl hover:-translate-y-1 group"
              }`}
            >
              {/* 🏷️ STATUS BADGE */}
              <div className="absolute top-6 right-6">
                {isLocked ? (
                  <span className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                    <Lock size={12} />
                    Editing...
                  </span>
                ) : (
                  <span
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
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
                  className={`block w-fit ${isLocked ? "pointer-events-none" : ""}`}
                >
                  <div
                    className={`flex items-center gap-3 font-bold px-4 py-2 rounded-xl transition-colors ${
                      isLocked
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                      Customer
                    </p>
                    <Link
                      to={`/appointments/${app.id}`}
                      className={isLocked ? "pointer-events-none" : ""}
                    >
                      <h3
                        className={`text-2xl font-black leading-tight text-left truncate transition-colors decoration-2 underline-offset-4 ${
                          isLocked
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
                          isLocked ? "text-slate-400" : "text-indigo-500"
                        }
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Assigned Staff
                      </p>
                      <p
                        className={`text-sm font-bold ${isLocked ? "text-slate-500" : "text-slate-700"}`}
                      >
                        {app.staff?.name || "Unassigned"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 💸 PRICE BADGE */}
                <div
                  className={`flex items-center justify-between p-4 rounded-2xl border ${
                    isLocked
                      ? "bg-slate-50 border-slate-100"
                      : "bg-emerald-50/50 border-emerald-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Banknote
                      size={16}
                      className={
                        isLocked ? "text-slate-400" : "text-emerald-600"
                      }
                    />
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? "text-slate-400" : "text-emerald-600"}`}
                    >
                      Fee
                    </span>
                  </div>
                  <span
                    className={`text-xl font-black ${isLocked ? "text-slate-500" : "text-emerald-700"}`}
                  >
                    ₺{app.price || 0}
                  </span>
                </div>
              </div>

              {/* 💎 ACTION PANEL: Butonlar */}
              <div className="pt-6 space-y-4 border-t border-slate-50">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
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
                            statusLoading || app.status === status || isLocked
                          }
                          className={`py-2 rounded-xl text-[9px] font-black transition-all border ${
                            app.status === status && !isLocked
                              ? "bg-slate-900 border-slate-900 text-white shadow-md"
                              : isLocked
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLocked) handleEdit(app);
                    }}
                    disabled={isLocked}
                    className={`flex-1 py-3 rounded-xl font-black transition-colors text-[10px] uppercase tracking-widest flex justify-center items-center gap-2 ${
                      isLocked
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-slate-900 text-white hover:bg-indigo-600"
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Lock size={14} /> Locked
                      </>
                    ) : (
                      "Edit Case"
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLocked) handleDelete(app.id);
                    }}
                    disabled={deleteLoading || isLocked}
                    className={`px-4 rounded-xl transition-colors border ${
                      isLocked
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

      {/* --- 🚨 EMPTY STATE --- */}
      {data?.myAppointments?.length === 0 && (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold text-xl italic">
            No operations found in queue.✨
          </p>
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
