import { useNavigate, useParams } from "react-router-dom";
import { GET_STAFF } from "../../../graphql/queries/auth";
import { useMutation, useQuery } from "@apollo/client";
import { DELETE_STAFF } from "../../../graphql/mutations/staff";
import AddStaffModal from "../../../components/shared/AddStaffModal";
import DetailLayout from "../../../components/shared/DetailLayout";
import { useState } from "react";
import {
  Award,
  Briefcase,
  Database,
  Mail,
  Phone,
  Calendar,
  ClipboardList,
} from "lucide-react";

const StaffDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error } = useQuery(GET_STAFF, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const staff = data?.getStaff;

  const [deleteStaff] = useMutation(DELETE_STAFF, {
    onCompleted: () => navigate("/staff"),
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

  if (!staff) {
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
        // 💎 HEADER: Professional Identity
        title={staff.name || "Specialist Detail"}
        backUrl="/staff" // 🩺 FIXED: Redirecting to staff directory
        onEdit={() => setIsModalOpen(true)}
        onDelete={() => {
          if (
            window.confirm(
              "Are you sure you want to permanently remove this specialist from the roster? 🚨",
            )
          )
            deleteStaff({ variables: { id } });
        }}
        // 👤 LEFT SIDE: Specialist Identity & Status Pulse
        profileSlot={
          <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden text-left sticky top-8">
            <div className="bg-indigo-600 p-8 text-white space-y-4">
              {staff.imageUrl ? (
                <img
                  src={staff.imageUrl}
                  alt={staff.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                />
              ) : (
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md text-2xl font-black">
                  {staff.name?.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-black">Specialist Profile</h3>
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">
                  {staff.expertise}
                </p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                  Onboarding Date
                </p>
                <p className="font-bold text-slate-700 text-lg">
                  {staff.createdAt
                    ? new Date(staff.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "---"}
                </p>
              </div>
              <div className="group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                  Primary Expertise
                </p>
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-lg">
                  <Award size={18} />
                  {staff.expertise}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                    staff.isActive
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-rose-50 text-rose-600 border border-rose-100"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${staff.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                  />
                  {staff.isActive ? "Active Duty" : "On Leave"}
                </div>
              </div>
            </div>
          </div>
        }
        // 📊 TOP STATS: Operation & Affiliation
        statsSlot={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between text-left group hover:border-indigo-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Specialization Domain
                </p>
                <p className="text-2xl font-black text-indigo-600 mt-1">
                  {staff.expertise}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                <Briefcase size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between text-left group hover:border-indigo-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tenant Affiliation
                </p>
                <p className="text-xl font-black text-slate-800 mt-1 font-mono uppercase">
                  #{staff.tenantId?.slice(0, 8)}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:scale-110 transition-transform">
                <Database size={24} />
              </div>
            </div>
          </div>
        }
        // 🏥 MAIN CONTENT: Professional Dossier
        mainContentSlot={
          <div className="space-y-10 text-left">
            {/* Section 1: Name & ID Header */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">
                Staff Directory
              </p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                {staff.name}
                <span className="text-slate-300 font-light mx-4">/</span>
                <span className="text-slate-400">
                  ID #{staff.id?.slice(-6)}
                </span>
              </h2>
            </div>

            {/* Section 2: Contact & Availability Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                  <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                    <Mail size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Contact Channels
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group">
                    <Mail
                      size={16}
                      className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                    />
                    <p className="font-bold text-slate-700">{staff.email}</p>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group">
                    <Phone
                      size={16}
                      className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                    />
                    <p className="font-bold text-slate-700">{staff.phone}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                  <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                    <Calendar size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Work Schedule
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {staff.workDays.length > 0 ? (
                    staff.workDays.map((day: string) => (
                      <span
                        key={day}
                        className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm"
                      >
                        {day.slice(0, 3)}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-400 italic font-medium">
                      No work days assigned.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Professional Biography Card */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-900/10 space-y-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="bg-white/10 p-3 rounded-2xl text-indigo-400">
                  <ClipboardList size={20} />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Professional Biography
                </h2>
              </div>
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
                <p className="text-slate-300 text-lg leading-relaxed italic font-medium">
                  {staff.bio ||
                    "No professional biography or clinical observations have been recorded for this specialist yet. 💉"}
                </p>
              </div>
            </div>
          </div>
        }
      />

      <AddStaffModal
        key={staff.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={staff}
      />
    </div>
  );
};

export default StaffDetailPage;
