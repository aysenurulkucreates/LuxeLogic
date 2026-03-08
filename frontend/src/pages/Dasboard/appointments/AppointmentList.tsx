import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { GET_MY_APPOINTMENTS } from "../../../graphql/queries/auth";
import { DELETE_APPOINTMENT } from "../../../graphql/mutations/appointments";
import { CalendarClock, Search, Trash2, User } from "lucide-react";
import AddAppointmentModal from "../../../components/shared/AddAppointmentModal";

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

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
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

  // --- SEARCH DEBOUNCE ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- QUERIES ---
  const {
    loading: listLoading,
    error: listError,
    data,
  } = useQuery(GET_MY_APPOINTMENTS, {
    variables: { input: { searchTerm: debouncedSearchTerm } },
  });

  // --- MUTATIONS ---
  const [deleteAppointment, { loading: deleteLoading }] = useMutation(
    DELETE_APPOINTMENT,
    {
      refetchQueries: [{ query: GET_MY_APPOINTMENTS }],
      onCompleted: () => {
        alert("Appointment successfully discharged from the system. 🚑");
      },
      onError: (err) => {
        alert(`Appoinment could not be deleted: ${err.message}`);
      },
    },
  );

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm("Are you sure? This record will be permanently lost! 🚨")
    ) {
      await deleteAppointment({ variables: { id } });
    }
  };

  // --- UI TRIAGE (LOADING/ERROR states) ---
  if (listLoading)
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (listError)
    return (
      <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-100 mt-10 font-bold">
        🚨 System Error: {listError.message}
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* --- HEADER & SEARCH --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Appointment
            <span className="text-indigo-600">Operation Center</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Manage all operations with surgical precision✨
          </p>
        </div>

        <div className="relative group w-full md:w-96">
          <input
            type="text"
            placeholder="Search staff or appointment..."
            className="pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl w-full focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            <Search size={24} />
          </div>
        </div>
      </div>

      {/* --- UNIFIED APPOINTMENT GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* 1. New Appointment Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-4 hover:bg-indigo-50 hover:border-indigo-400 transition-all group min-h-75"
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

        {/* 2. Map Appointments */}
        {data?.myAppointments?.map((app: Appointment) => (
          <div
            key={app.id}
            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-75"
          >
            {/* Status Badge */}
            <div className="absolute top-6 right-6">
              <span
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  app.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {app.status}
              </span>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-indigo-600 font-bold bg-indigo-50 w-fit px-4 py-2 rounded-xl">
                <CalendarClock size={20} />
                <span className="text-sm">
                  {new Date(app.startTime).toLocaleDateString()} @
                  {new Date(app.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Patient / Customer
                </p>
                <h3 className="text-2xl font-black text-slate-800 leading-tight">
                  {app.customer?.name}
                </h3>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <User size={18} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Assigned Staff
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {app.staff?.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 flex gap-3">
              <button
                onClick={() => handleEdit(app)}
                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(app.id)}
                disabled={deleteLoading}
                className="px-5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors border border-rose-100 disabled:opacity-50"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- EMPTY STATE --- */}
      {data?.myAppointments?.length === 0 && (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold text-xl italic">
            No operations found.✨
          </p>
        </div>
      )}

      {/* --- MODAL --- */}
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
