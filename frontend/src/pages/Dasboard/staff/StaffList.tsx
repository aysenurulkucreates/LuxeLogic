import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Link } from "react-router-dom"; // 🩺 CRITICAL: Link injection added
import {
  UserPlus,
  Pencil,
  Search,
  Trash2,
  Phone,
  UserX,
  Mail,
  Award,
} from "lucide-react";
import { GET_MY_STAFF } from "../../../graphql/queries/auth";
import { DELETE_STAFF } from "../../../graphql/mutations/staff";
import AddStaffModal from "../../../components/shared/AddStaffModal";

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
}

const StaffList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { loading, error, data } = useQuery(GET_MY_STAFF, {
    variables: { searchTerm: debouncedSearchTerm },
  });

  const [deleteStaff] = useMutation(DELETE_STAFF, {
    refetchQueries: [{ query: GET_MY_STAFF }],
    onCompleted: () =>
      alert("Specialist successfully discharged from the roster. 💉"),
  });

  const handleEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
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

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-indigo-600 font-black uppercase tracking-widest text-xs">
          Paging Medical Team... 💉
        </p>
      </div>
    );

  if (error)
    return (
      <div className="p-10 max-w-7xl mx-auto">
        <div className="bg-rose-50 text-rose-600 p-8 rounded-[2.5rem] border border-rose-100 font-black text-center shadow-sm">
          🚨 Diagnostic Error: {error.message}
        </div>
      </div>
    );

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
          Add New Specialist
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
        <div className="grid grid-cols-6 bg-slate-50/50 px-10 py-7 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span className="col-span-2">Specialist Identity</span>
          <span>Contact Channels</span>
          <span>Domain</span>
          <span>Availability</span>
          <span className="text-right">Operation</span>
        </div>

        <div className="divide-y divide-slate-50">
          {data?.myStaff?.length > 0 ? (
            data.myStaff.map((staff: Staff) => (
              <div
                key={staff.id}
                className="grid grid-cols-6 px-10 py-9 items-center hover:bg-indigo-50/30 transition-all group"
              >
                {/* 🔗 THE MASTER LINK: Name & Avatar */}
                <div className="col-span-2">
                  <Link
                    to={`/staff/${staff.id}`}
                    className="flex items-center gap-5 w-fit group/link"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-100 group-hover/link:scale-110 transition-transform duration-300">
                      {staff.imageUrl ? (
                        <img
                          src={staff.imageUrl}
                          alt={staff.name}
                          className="w-full h-full object-cover rounded-3xl"
                        />
                      ) : (
                        staff.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-xl group-hover/link:text-indigo-600 transition-colors">
                        {staff.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`w-2 h-2 rounded-full ${staff.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {staff.isActive ? "Active Duty" : "On Leave"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Email & Phone */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                    <Mail size={14} className="text-indigo-400" />
                    {staff.email}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                    <Phone size={14} className="text-indigo-400" />
                    {staff.phone}
                  </div>
                </div>

                {/* Expertise */}
                <div>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                    <Award size={14} />
                    {staff.expertise}
                  </span>
                </div>

                {/* Work Days */}
                <div className="flex flex-wrap gap-1.5">
                  {staff.workDays?.slice(0, 3).map((day, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] bg-slate-100 px-3 py-1.5 rounded-lg font-black text-slate-400 uppercase tracking-widest"
                    >
                      {day.substring(0, 3)}
                    </span>
                  ))}
                  {staff.workDays?.length > 3 && (
                    <span className="text-[9px] text-indigo-400 font-black">
                      + {staff.workDays.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => handleEdit(staff)}
                    className="p-4 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(staff.id)}
                    className="p-4 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
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
