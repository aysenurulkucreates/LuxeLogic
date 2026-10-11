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
import { Banknote, X, CalendarClock, Save } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import ErrorState from "../ui/ErrorState";
import LoadingState from "../ui/LoadingState";

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
    refetch: refetchStaff,
  } = useQuery(GET_MY_STAFF, {
    variables: { searchTerm: debouncedSearchTerm },
  });

  const {
    loading: customerLoading,
    error: customerError,
    data: customerData,
    refetch: refetchCustomers,
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
      onError: (err) =>
        toast.error(`Could not create appointment: ${err.message}`),
    },
  );

  const [updateAppointment, { loading: updateLoading }] = useMutation(
    UPDATE_APPOINTMENT,
    {
      refetchQueries: [{ query: GET_MY_APPOINTMENTS }],
      onCompleted: () => onClose(),
      onError: (err) =>
        toast.error(`Could not update appointment: ${err.message}`),
    },
  );

  if (!isOpen) return null;

  // --- 🚑 TRIAGE STATES ---
  if ((staffLoading && !staffData) || (customerLoading && !customerData))
    return <LoadingState layout="modal" />;

  if (staffError || customerError)
    return (
      <ErrorState
        error={staffError || customerError}
        onRetry={() => {
          refetchStaff();
          refetchCustomers();
        }}
        layout="modal"
      />
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId || !formData.staffId) {
      toast.error("Please select a staff member and a customer.");
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
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* MODAL HEADER */}
        <div className="bg-indigo-600 p-8 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <CalendarClock size={28} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {initialData ? "Edit appointment" : "New appointment"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="px-8 pt-6">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search staff or customers..."
              className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-lg focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700 outline-none"
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
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                name="startTime"
                className="w-full p-4 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                End Time
              </label>
              <input
                type="datetime-local"
                name="endTime"
                className="w-full p-4 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Assigned Staff
              </label>
              <select
                name="staffId"
                className="w-full p-4 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                value={formData.staffId}
                onChange={handleChange}
                required
              >
                <option value="">Select staff...</option>
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
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Customer
              </label>
              <select
                name="customerId"
                className="w-full p-4 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                value={formData.customerId}
                onChange={handleChange}
                required
              >
                <option value="">Select customer...</option>
                {customerData?.myCustomers?.map((cust: Customer) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 💎 PRICE INPUT 💎 */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-emerald-600 ml-1">
                Fee ($)
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
                  className="w-full pl-12 pr-4 py-4 bg-emerald-50 border-2 border-transparent rounded-lg focus:border-emerald-500 focus:bg-white transition-all font-semibold text-emerald-700 outline-none"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 ml-1">
              Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Add notes..."
              className="w-full p-4 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 resize-none"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-all"
            >
              Cancel
            </button>
            <Button
              type="submit"
              icon={initialData ? Save : CalendarClock}
              isLoading={createLoading || updateLoading}
              className="flex-2"
            >
              {createLoading || updateLoading
                ? "Saving…"
                : initialData
                  ? "Save changes"
                  : "Create appointment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAppointmentModal;
