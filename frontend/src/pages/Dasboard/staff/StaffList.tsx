import { useState, useEffect } from "react";
import { GET_MY_STAFF } from "../../../graphql/queries/auth";
import { DELETE_STAFF } from "../../../graphql/mutations/staff";
import { useMutation, useQuery } from "@apollo/client";
import {
  LayoutGrid,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
  Phone,
  Briefcase,
  UserX,
} from "lucide-react";
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
    onCompleted: () => alert("Staff member removed from the team."),
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
        "Are you sure you want to delete this staff member? This cannot be undone!",
      )
    ) {
      await deleteStaff({ variables: { id } });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-100 mt-10">
        ⚠️ Diagnostic Error: {error.message}
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Search & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div className="relative max-w-md w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search team by name or expertise..."
            className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-bold active:scale-95"
        >
          <PackagePlus size={20} />
          Add New Professional
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Team Roster
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          Active personnel in your clinic:{" "}
          <span className="text-indigo-600">{data?.myStaff?.length || 0}</span>
        </p>
      </div>

      {/* Table Structure */}
      <div className="bg-white rounded-4xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-6 bg-slate-50/80 px-8 py-5 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
          <span className="col-span-2">Professional</span>
          <span>Contact</span>
          <span>Expertise</span>
          <span>Schedule</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y divide-slate-50">
          {data?.myStaff?.length > 0 ? (
            data.myStaff.map((staff: Staff) => (
              <div
                key={staff.id}
                className="grid grid-cols-6 px-8 py-7 items-center hover:bg-indigo-50/20 transition-all group"
              >
                {/* Name & ID */}
                <div className="col-span-2 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100">
                    {staff.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-lg leading-tight">
                      {staff.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase mt-1 ${staff.isActive ? "text-emerald-500" : "text-slate-400"}`}
                    >
                      {staff.isActive ? "● Active" : "○ Inactive"}
                    </span>
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <LayoutGrid size={12} className="text-slate-400" />
                    {staff.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Phone size={12} className="text-slate-400" />
                    {staff.phone}
                  </div>
                </div>

                {/* Expertise */}
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold">
                    <Briefcase size={12} />
                    {staff.expertise}
                  </span>
                </div>

                {/* Work Days */}
                <div className="flex flex-wrap gap-1">
                  {staff.workDays?.slice(0, 3).map((day, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-500"
                    >
                      {day.substring(0, 3)}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => handleEdit(staff)}
                    className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(staff.id)}
                    className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-32 text-center flex flex-col items-center gap-4">
              <UserX size={64} className="text-slate-200" />
              <p className="text-slate-400 font-bold text-lg">
                Your medical team is currently empty.
              </p>
              <p className="text-slate-300 text-sm max-w-xs">
                Start by adding your first professional staff to the roster.
              </p>
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
