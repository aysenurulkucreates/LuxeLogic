import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_APPOINTMENT,
  UPDATE_APPOINTMENT,
} from "../../graphql/mutations/appointments";
import {
  GET_MY_APPOINTMENTS,
  GET_MY_CUSTOMERS,
  GET_MY_STAFF,
} from "../../graphql/queries/auth";
import { Banknote, X, CalendarClock } from "lucide-react";

interface Staff {
  id: string;
  name: string;
  email?: string;
  expertise?: string;
  role?: string;
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
  id?: string;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
  notes?: string;
  customer: Customer;
  staff: Staff;
  tenant: Tenant;
}

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Appointment | null;
}

interface AppointmentFormData {
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  price: string | number;
  customerId: string;
  staffId: string;
  tenantId: string;
}

const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    loading: staffLoading,
    error: staffError,
    data: staffData,
  } = useQuery(GET_MY_STAFF, {
    variables: { searchTerm: debouncedSearchTerm },
  });

  const {
    loading: customerLoading,
    error: customerError,
    data: customerData,
  } = useQuery(GET_MY_CUSTOMERS, {
    variables: { searchTerm: debouncedSearchTerm },
  });

  const [formData, setFormData] = useState<AppointmentFormData>({
    startTime: initialData?.startTime
      ? new Date(initialData.startTime).toISOString().slice(0, 16)
      : "",
    endTime: initialData?.endTime
      ? new Date(initialData.endTime).toISOString().slice(0, 16)
      : "",
    status: initialData?.status || "PENDING",
    notes: initialData?.notes || "",
    price: initialData?.price || "",
    customerId: initialData?.customer?.id || "",
    staffId: initialData?.staff?.id || "",
    tenantId: initialData?.tenant?.id || "",
  });

  const [createAppointment, { loading: createLoading }] = useMutation(
    CREATE_APPOINTMENT,
    {
      refetchQueries: [{ query: GET_MY_APPOINTMENTS }],
      onCompleted: () => {
        onClose();
        setFormData({
          startTime: "",
          endTime: "",
          status: "PENDING",
          notes: "",
          price: "",
          customerId: "",
          staffId: "",
          tenantId: "",
        });
      },
    },
  );

  const [updateAppointment, { loading: updateLoading }] = useMutation(
    UPDATE_APPOINTMENT,
    {
      refetchQueries: [{ query: GET_MY_APPOINTMENTS }],
      onCompleted: () => onClose(),
    },
  );

  if (!isOpen) return null;

  // --- 🚑 TRIAGE STATES ---
  if (staffLoading || customerLoading)
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (staffError || customerError)
    return (
      <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-100 mt-10 font-bold">
        🚨 System Error:{" "}
        {staffError?.message ||
          customerError?.message ||
          "Unexpected error occured."}
      </div>
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId || !formData.staffId) {
      alert("Choose your staff and customers first. 🚑");
      return;
    }

    const formattedInput = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      price: parseFloat(formData.price.toString()) || 0,
    };

    if (initialData?.id) {
      await updateAppointment({
        variables: {
          id: initialData.id,
          input: formattedInput,
        },
      });
    } else {
      await createAppointment({
        variables: { input: formattedInput },
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* MODAL HEADER */}
        <div className="bg-indigo-600 p-8 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <CalendarClock size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">
                {initialData ? "Edit Operation" : "New Operation"} 💉
              </h2>
              <p className="text-indigo-100 text-sm">
                LuxeLogic Surgical Precision
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="px-8 pt-6">
          <div className="relative group">
            <input
              type="text"
              placeholder="Quick search for staff or patient... 🔍"
              className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* MODAL BODY (FORM) */}
        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                name="startTime"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                End Time
              </label>
              <input
                type="datetime-local"
                name="endTime"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Assigned Staff
              </label>
              <select
                name="staffId"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                value={formData.staffId}
                onChange={handleChange}
                required
              >
                <option value="">Select surgical staff...</option>
                {staffData?.myStaff
                  ?.filter((staff: Staff) => staff.role === "DOCTOR")
                  .map((staff: Staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Patient / Customer
              </label>
              <select
                name="customerId"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                value={formData.customerId}
                onChange={handleChange}
                required
              >
                <option value="">Select patient...</option>
                {customerData?.myCustomers?.map((cust: Customer) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 💎 PRICE INPUT 💎 */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-emerald-600 uppercase tracking-widest ml-1">
                Operation Fee (TRY)
              </label>
              <div className="relative">
                <div className="absolute left-4 top-4 text-emerald-500">
                  <Banknote size={20} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 bg-emerald-50 border-2 border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white transition-all font-black text-emerald-700 outline-none"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              Operation Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Specific surgical requirements or patient notes... ✨"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 resize-none"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || updateLoading}
              className="flex-2 py-4 px-6 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {createLoading || updateLoading
                ? "Sterilizing Data..."
                : initialData
                  ? "Update Operation"
                  : "Confirm Operation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAppointmentModal;
