import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GET_APPOINTMENT } from "../../../graphql/queries/auth";
import { DELETE_APPOINTMENT } from "../../../graphql/mutations/appointments";
import AddAppointmentModal from "../../../components/shared/AddAppointmentModal";
import DetailLayout from "../../../components/shared/DetailLayout";
import {
  Calendar,
  ClipboardList,
  Mail,
  Phone,
  Clock,
  Banknote,
  User,
} from "lucide-react";

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error } = useQuery(GET_APPOINTMENT, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const appointment = data?.getAppointment;

  const [deleteAppointment] = useMutation(DELETE_APPOINTMENT, {
    onCompleted: () => navigate("/appointments"),
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="text-indigo-600 font-black animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Resuscitating data... 💉
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="p-10 bg-white rounded-[2.5rem] shadow-xl border border-rose-100 text-rose-600 font-bold text-center">
          <p className="text-4xl mb-4">🚨</p>
          System Failure: {error.message}
        </div>
      </div>
    );

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-20 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100">
          <h1 className="text-3xl font-black text-slate-800 mb-2">
            No file found! 🔍
          </h1>
          <button
            onClick={() => navigate("/appointments")}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg"
          >
            ← Back to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <DetailLayout
        // 🩺 TS FIX: Title artık sadece string (metin) istiyor!
        title={appointment.customer?.name || "Patient Detail"}
        backUrl="/appointments"
        onEdit={() => setIsModalOpen(true)}
        onDelete={() => {
          if (
            window.confirm(
              "Are you sure you want to delete this clinical record? 🚨",
            )
          )
            deleteAppointment({ variables: { id } });
        }}
        // 👤 LEFT SIDE: Schedule Summary
        profileSlot={
          <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden text-left sticky top-8">
            <div className="bg-indigo-600 p-8 text-white space-y-2">
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Calendar size={24} />
              </div>
              <h3 className="text-xl font-black pt-2">Schedule Info</h3>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Time Slot
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
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
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
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between text-left">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Fee
                </p>
                <p className="text-3xl font-black text-indigo-600 mt-1">
                  ₺{appointment.price || 0}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                <Banknote size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between text-left">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Specialist
                </p>
                <p className="text-xl font-black text-slate-800 mt-1">
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
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">
                Clinical Report
              </p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                {appointment.customer?.name}
                <span className="text-slate-300 font-light mx-4">/</span>
                <span className="text-slate-400">Case #{id?.slice(-4)}</span>
              </h2>
            </div>

            {/* Patient Identity */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                  <User size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Patient Identity
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                      <Mail size={16} />
                    </div>
                    <p className="font-bold text-slate-600">
                      {appointment.customer?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                      <Phone size={16} />
                    </div>
                    <p className="font-bold text-slate-600">
                      {appointment.customer?.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-900/10 space-y-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="bg-white/10 p-3 rounded-2xl text-indigo-400">
                  <ClipboardList size={20} />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Clinical Notes
                </h2>
              </div>
              <div className="bg-white/5 p-8 rounded-4xl border border-white/5">
                <p className="text-slate-300 text-lg leading-relaxed italic font-medium">
                  {appointment.notes
                    ? `"${appointment.notes}"`
                    : "No medical observations recorded. 💉"}
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
