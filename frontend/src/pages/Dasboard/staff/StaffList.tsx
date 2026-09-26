import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { Link } from "react-router-dom";
import {
  UserPlus,
  Pencil,
  Search,
  Trash2,
  Phone,
  UserX,
  Mail,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { GET_MY_STAFF } from "../../../graphql/queries/auth";
import { DELETE_STAFF } from "../../../graphql/mutations/staff";
import AddStaffModal from "../../../components/shared/AddStaffModal";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import toast from "react-hot-toast";
import { useAuth } from "../../../hooks/useAuth";
import { useSocket } from "../../../hooks/useSocket";
import { useRecordLock } from "../../../hooks/useRecordLock";

// User Interface'i
interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId: string; // İşte altın anahtarımız!
}

interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string;
  expertise: string;
  workDays: string[];
  isActive: boolean;
  imageUrl?: string;
  bio?: string;
  role: string; // 🚨 Rolü de dahil ettik ki listede okuyabilelim
}

const StaffList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const { user } = useAuth() as { user: User | null };
  const client = useApolloClient();

  const userTenantId = user?.tenantId;

  const socket = useSocket(userTenantId);
  const { isLocked, lockRecord, unlockRecord } = useRecordLock(
    socket,
    userTenantId,
    user?.email,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    loading,
    error,
    data: currentData,
    previousData,
    refetch,
  } = useQuery(GET_MY_STAFF, {
    variables: { searchTerm: debouncedSearchTerm },
  });
  // Yeni arama sonucu gelene kadar önceki listeyi göstermeye devam et
  const data = currentData ?? previousData;
  const isRefreshing = loading && !!data;

  const [deleteStaff] = useMutation(DELETE_STAFF, {
    refetchQueries: [{ query: GET_MY_STAFF }],
    onCompleted: () =>
      toast.success("Specialist successfully discharged from the roster. 💉"),
    onError: (err) => toast.error(`Could not delete staff: ${err.message}`),
  });

  useEffect(() => {
    const handleCreated = (newStaff: Staff) => {
      toast.success(`Staff ${newStaff.name} successfully created`, {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      client.cache.updateQuery(
        {
          query: GET_MY_STAFF,
          variables: { searchTerm: debouncedSearchTerm },
        },
        (existingData) => {
          if (!existingData) return null;

          return {
            myStaff: [...existingData.myStaff, newStaff],
          };
        },
      );
    };

    const handleDeleted = (deletedId: string) => {
      toast.success(`Staff successfully deleted`, {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      client.cache.updateQuery(
        {
          query: GET_MY_STAFF,
          variables: { searchTerm: debouncedSearchTerm },
        },
        (existingData) => {
          if (!existingData) return null;

          return {
            myStaff: existingData.myStaff.filter(
              (staff: Staff) => staff.id !== deletedId,
            ),
          };
        },
      );
    };

    const handleUpdated = (updatedStaff: Staff) => {
      toast.success(`Staff ${updatedStaff.name} sucessfully updated`, {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      refetch();
    };

    socket.on("staff_created", handleCreated);
    socket.on("staff_deleted", handleDeleted);
    socket.on("staff_updated", handleUpdated);

    return () => {
      socket.off("staff_created", handleCreated);
      socket.off("staff_deleted", handleDeleted);
      socket.off("staff_updated", handleUpdated);
    };
  }, [socket, client, debouncedSearchTerm, refetch]);

  const handleEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    lockRecord(staff.id);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    unlockRecord(selectedStaff?.id);
    setSelectedStaff(null);
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to permanently remove this specialist from the team? 🚨",
      )
    ) {
      await deleteStaff({ variables: { id } });
    }
  };

  // 🚨 Rol İsimlerini Ekrana Güzel Basmak İçin Minik Bir Sözlük (Helper)
  const formatRole = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "System Architect";
      case "TENANT_ADMIN":
        return "Clinic Manager";
      case "DOCTOR":
        return "Doctor / Specialist";
      case "NURSE":
        return "Nurse / Assistant";
      case "STAFF":
        return "Secretary / Reception";
      default:
        return role;
    }
  };

  // 🚨 Role Göre Renk Ayarlamak İçin (Kurumsal Dokunuş 💅)
  const getRoleStyle = (role: string) => {
    switch (role) {
      case "DOCTOR":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "TENANT_ADMIN":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "NURSE":
        return "bg-blue-50 text-blue-700 border-blue-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700 text-left">
      {/* --- SEARCH & HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div className="relative max-w-md w-full group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search specialists or skills..."
            className="block w-full pl-14 pr-4 py-4 bg-white border border-slate-100 rounded-[1.8rem] shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-10 py-4 rounded-[1.8rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-black uppercase text-xs tracking-widest active:scale-95"
        >
          <UserPlus size={18} />
          Add New Professional
        </button>
      </div>

      <div className="mb-10 space-y-1">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Medical <span className="text-indigo-600">Team Roster</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
          Current Active Professionals:{" "}
          <span className="text-indigo-600">{data?.myStaff?.length || 0}</span>
        </p>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden">
        {/* 🚨 YENİ VE JİLET GİBİ KURUMSAL TABLO BAŞLIKLARI */}
        <div className="grid grid-cols-6 bg-slate-50/50 px-10 py-7 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span className="col-span-2">Professional Identity</span>
          <span>Contact Info</span>
          <span>Role & Expertise</span>
          <span>Weekly Schedule</span>
          <span className="text-right">Actions</span>
        </div>

        <div
          aria-busy={loading}
          className={`divide-y divide-slate-50 transition-opacity ${isRefreshing ? "opacity-50" : ""}`}
        >
          {!data ? (
            <LoadingState layout="inline" />
          ) : data.myStaff?.length > 0 ? (
            data.myStaff.map((staff: Staff) => {
              // 🚨 ŞEF CERRAH RADARI: Bu personel kilitli mi?
              const locked = isLocked(staff.id);

              return (
                <div
                  key={staff.id}
                  className={`grid grid-cols-6 px-10 py-9 items-center transition-all group ${
                    locked
                      ? "bg-slate-50/50 opacity-60 grayscale-20 pointer-events-none"
                      : "hover:bg-indigo-50/30 bg-white"
                  }`}
                >
                  {/* 🔗 THE MASTER LINK: Name & Avatar */}
                  <div className="col-span-2">
                    <Link
                      to={`/staff/${staff.id}`}
                      className={`flex items-center gap-5 w-fit group/link ${locked ? "pointer-events-none" : ""}`}
                    >
                      <div
                        className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl shadow-lg transition-transform duration-300 ${
                          locked
                            ? "bg-slate-300 text-slate-100"
                            : "bg-indigo-600 text-white shadow-indigo-100 group-hover/link:scale-110"
                        }`}
                      >
                        {staff.imageUrl ? (
                          <img
                            src={staff.imageUrl}
                            alt={staff.name}
                            className={`w-full h-full object-cover rounded-3xl ${locked ? "grayscale" : ""}`}
                          />
                        ) : (
                          staff.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`font-black text-xl transition-colors ${
                            locked
                              ? "text-slate-500"
                              : "text-slate-800 group-hover/link:text-indigo-600"
                          }`}
                        >
                          {staff.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              locked
                                ? "bg-slate-300"
                                : staff.isActive
                                  ? "bg-emerald-500 animate-pulse"
                                  : "bg-rose-500" // Aktif değilse kırmızı nokta
                            }`}
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {locked
                              ? "Editing..."
                              : staff.isActive
                                ? "Active Duty"
                                : "On Leave"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                      <Mail
                        size={14}
                        className={
                          locked ? "text-slate-400" : "text-indigo-400"
                        }
                      />
                      {staff.email}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                      <Phone
                        size={14}
                        className={
                          locked ? "text-slate-400" : "text-indigo-400"
                        }
                      />
                      {staff.phone}
                    </div>
                  </div>

                  {/* 🚨 YENİ: Role & Expertise (RBAC Gösterimi) */}
                  <div className="flex flex-col gap-1.5 items-start">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        locked
                          ? "bg-slate-50 text-slate-400 border-slate-100"
                          : getRoleStyle(staff.role)
                      }`}
                    >
                      <ShieldAlert size={12} />
                      {formatRole(staff.role)}
                    </span>
                    {/* Altında eski expertise (varsa) cılız ve şık dursun */}
                    {staff.expertise && (
                      <span className="text-[10px] font-bold text-slate-400 ml-1">
                        • {staff.expertise}
                      </span>
                    )}
                  </div>

                  {/* Weekly Schedule */}
                  <div className="flex flex-wrap gap-1.5">
                    {staff.workDays?.length > 0 ? (
                      staff.workDays.slice(0, 3).map((day, idx) => (
                        <span
                          key={idx}
                          className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest ${
                            locked
                              ? "bg-slate-50 text-slate-300"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {day.substring(0, 3)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 italic">
                        Unassigned
                      </span>
                    )}
                    {staff.workDays?.length > 3 && (
                      <span
                        className={`text-[9px] font-black ${locked ? "text-slate-300" : "text-indigo-400"}`}
                      >
                        + {staff.workDays.length - 3}
                      </span>
                    )}
                  </div>

                  {/* 🚨 ACTIONS */}
                  <div
                    className={`flex justify-end gap-3 transition-all duration-300 ${locked ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <button
                      onClick={() => !locked && handleEdit(staff)}
                      disabled={locked}
                      className={`p-4 shadow-sm border rounded-2xl transition-all ${
                        locked
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100"
                      }`}
                    >
                      {locked ? <Lock size={20} /> : <Pencil size={20} />}
                    </button>
                    <button
                      onClick={() => !locked && handleDelete(staff.id)}
                      disabled={locked}
                      className={`p-4 shadow-sm border rounded-2xl transition-all ${
                        locked
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100"
                      }`}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-40 text-center flex flex-col items-center gap-6">
              <div className="p-10 bg-slate-50 rounded-full">
                <UserX size={64} className="text-slate-200" />
              </div>
              <div className="space-y-2">
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                  Roster is currently empty.✨
                </p>
                <p className="text-slate-300 text-xs font-medium">
                  Start by adding your first medical professional.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddStaffModal
        key={selectedStaff?.id || "new"}
        isOpen={isModalOpen}
        onClose={handleClose}
        initialData={selectedStaff}
      />
    </div>
  );
};

export default StaffList;
