import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GET_APPOINTMENT } from "../../../graphql/queries/auth";
import { DELETE_APPOINTMENT } from "../../../graphql/mutations/appointments";
import AddAppointmentModal from "../../../components/shared/AddAppointmentModal";
import DetailLayout from "../../../components/shared/DetailLayout";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import Button from "../../../components/ui/Button";
import {
  Calendar,
  ClipboardList,
  Mail,
  Phone,
  Clock,
  Banknote,
  User,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_APPOINTMENT, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const appointment = data?.getAppointment;

  const [deleteAppointment] = useMutation(DELETE_APPOINTMENT, {
    onCompleted: () => navigate("/appointments"),
    onError: (err) =>
      toast.error(`Could not delete appointment: ${err.message}`),
  });

  if (loading && !data) return <LoadingState />;

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!appointment) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            Appointment not found
          </h1>
          <Button icon={ArrowLeft} onClick={() => navigate("/appointments")}>
            Back to appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DetailLayout
        // 🩺 TS FIX: Title artık sadece string (metin) istiyor!
        title={appointment.customer?.name || "Appointment"}
        backUrl="/appointments"
        onEdit={() => setIsModalOpen(true)}
        onDelete={() => {
          if (
            window.confirm(
              "Are you sure you want to delete this appointment?",
            )
          )
            deleteAppointment({ variables: { id } });
        }}
        // 👤 LEFT SIDE: Schedule Summary
        profileSlot={
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden text-left sticky top-8">
            <div className="bg-indigo-600 p-8 text-white space-y-2">
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Calendar size={24} />
              </div>
              <h3 className="text-lg font-semibold pt-2">Schedule</h3>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Date
                </p>
                <p className="font-bold text-slate-700 text-lg">
                  {appointment.startTime
                    ? new Date(appointment.startTime).toLocaleDateString(
                        "en-US",
                        { day: "numeric", month: "long", year: "numeric" },
                      )
                    : "---"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Time
                </p>
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-lg">
                  <Clock size={16} />
                  {appointment.startTime
                    ? new Date(appointment.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "---"}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold ${
                    appointment.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full animate-pulse ${appointment.status === "COMPLETED" ? "bg-emerald-500" : "bg-amber-500"}`}
                  />
                  {appointment.status || "PENDING"}
                </div>
              </div>
            </div>
          </div>
        }
        // 📊 TOP STATS
        statsSlot={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between text-left">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Fee
                </p>
                <p className="text-3xl font-semibold text-indigo-600 mt-1">
                  ₺{appointment.price || 0}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                <Banknote size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between text-left">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Staff
                </p>
                <p className="text-xl font-semibold text-slate-800 mt-1">
                  {appointment.staff?.name || "Unassigned"}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-slate-400">
                <User size={24} />
              </div>
            </div>
          </div>
        }
        // 🏥 MAIN CONTENT
        mainContentSlot={
          <div className="space-y-10 text-left">
            {/* 💎 PREMIUM HEADER: Luxe tasarımı buraya dikişledik! */}
            <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xs font-semibold text-indigo-500 mb-2">
                Appointment
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                {appointment.customer?.name}
                <span className="text-slate-300 font-light mx-4">/</span>
                <span className="text-slate-400">Case #{id?.slice(-4)}</span>
              </h2>
            </div>

            {/* Patient Identity */}
            <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                  <User size={20} />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Customer
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                      <Mail size={16} />
                    </div>
                    <p className="font-bold text-slate-600">
                      {appointment.customer?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                      <Phone size={16} />
                    </div>
                    <p className="font-bold text-slate-600">
                      {appointment.customer?.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-slate-900 p-10 rounded-2xl text-white shadow-2xl shadow-indigo-900/10 space-y-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="bg-white/10 p-3 rounded-2xl text-indigo-400">
                  <ClipboardList size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Notes
                </h2>
              </div>
              <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
                <p className="text-slate-300 text-lg leading-relaxed italic font-medium">
                  {appointment.notes
                    ? `"${appointment.notes}"`
                    : "No notes added."}
                </p>
              </div>
            </div>
          </div>
        }
      />

      <AddAppointmentModal
        key={appointment.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={appointment}
      />
    </div>
  );
};

export default AppointmentDetailPage;
