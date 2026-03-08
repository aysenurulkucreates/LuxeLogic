import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  CREATE_APPOINTMENT,
  UPDATE_APPOINTMENT,
} from "../../graphql/mutations/appointments";
import {
  GET_MY_APPOINTMENTS,
  GET_MY_CUSTOMERS,
  GET_MY_STAFF,
} from "../../graphql/queries/auth";
import { X } from "lucide-react";

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
  id?: string;
  startTime: string;
  endTime: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId || !formData.staffId) {
      alert("Choose your staff and customers first.");
      return;
    }

    const formattedInput = {
      ...formData,

      startTime: new Date(formData.startTime).toISOString(),

      endTime: new Date(formData.endTime).toISOString(),
    };

    if (initialData?.id) {
      await updateAppointment({
        variables: {
          id: initialData.id,

          input: formattedInput,
        },
      });
    } else
      await createAppointment({
        variables: { input: formattedInput },
      });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* --- MODAL HEADER --- */}
        <div className="bg-indigo-600 p-8 flex justify-between items-center text-white">
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              {initialData ? "Edit Appointment" : "New Operation"} 💉
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              LuxeLogic Appointment Management System
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="px-8 pt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search staff or customer... 🔍"
              className="w-full p-4 bg-indigo-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-indigo-900 placeholder:text-indigo-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* --- MODAL BODY (FORM) --- */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Time */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                name="startTime"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                End Time
              </label>
              <input
                type="datetime-local"
                name="endTime"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>

            {/* Staff Select */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Staff Selection
              </label>
              <select
                name="staffId"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none"
                value={formData.staffId}
                onChange={handleChange}
              >
                <option value="">Select staff...</option>
                {staffData?.myStaff?.map((staff: Staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} {staff.expertise ? `(${staff.expertise})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Select */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Customer Selection
              </label>
              <select
                name="customerId"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none"
                value={formData.customerId}
                onChange={handleChange}
              >
                <option value="">Select customer...</option>
                {customerData?.myCustomers?.map((customer: Customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes Area */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">
              Customer Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="special requests or something else... ✨"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          {/* --- FOOTER ACTIONS --- */}
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
              className="flex-2 py-4 px-6 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {createLoading || updateLoading
                ? "Processing..."
                : initialData
                  ? "Save updating"
                  : "Confirm Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAppointmentModal;
