import { useState } from "react";
import { useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { Save, UserPlus } from "lucide-react";
import Button from "../ui/Button";
import { GET_MY_STAFF } from "../../graphql/queries/auth";
import { CREATE_STAFF, UPDATE_STAFF } from "../../graphql/mutations/staff";

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
  role?: string;
}

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Staff | null;
}

interface StaffFormData {
  name: string;
  phone: string;
  email: string;
  expertise: string;
  workDays: string[];
  isActive: boolean;
  imageUrl: string;
  bio: string;
  role: string;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const initialFormState: StaffFormData = {
    name: "",
    email: "",
    phone: "",
    expertise: "",
    workDays: [],
    isActive: true,
    imageUrl: "",
    bio: "",
    role: "STAFF",
  };

  const [formData, setFormData] = useState<StaffFormData>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    expertise: initialData?.expertise || "",
    workDays: initialData?.workDays || [],
    isActive: initialData?.isActive ?? true,
    imageUrl: initialData?.imageUrl || "",
    bio: initialData?.bio || "",
    role: initialData?.role || "STAFF",
  });

  const [createStaff, { loading: createLoading }] = useMutation(CREATE_STAFF, {
    refetchQueries: [{ query: GET_MY_STAFF }],
    onCompleted: (data) => {
      const tempPassword = data?.createStaff?.tempPassword;
      onClose();
      setFormData(initialFormState);
      if (tempPassword) {
        toast.success(
          `Staff added. Temporary password: ${tempPassword} - share it with them; they'll change it on first login.`,
          { duration: 15000 },
        );
      } else {
        toast.success(
          "Staff added to the team list. Nurses don't get a login account.",
        );
      }
    },
    onError: (err) => toast.error(`Could not add staff: ${err.message}`),
  });

  const [updateStaff, { loading: updateLoading }] = useMutation(UPDATE_STAFF, {
    refetchQueries: [{ query: GET_MY_STAFF }],
    onCompleted: () => onClose(),
    onError: (err) => toast.error(`Could not update staff: ${err.message}`),
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    const finalValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (initialData?.id) {
      const updatePayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        expertise: formData.expertise,
        workDays: formData.workDays,
        isActive: formData.isActive,
        imageUrl: formData.imageUrl,
        bio: formData.bio,
      };

      await updateStaff({
        variables: {
          id: initialData.id,
          input: updatePayload,
        },
      });
    } else {
      await createStaff({
        variables: {
          input: { ...formData },
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <form onSubmit={handleSubmit} className="p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">
            {initialData ? "Edit staff member" : "Add staff member"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 📝 Name Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 ml-1">
                Full Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* 📧 Email Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 ml-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* 📞 Phone Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 ml-1">
                Phone
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* 🎓 Expertise Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 ml-1">
                Expertise
              </label>
              <input
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* 🎭 ROLE SELECT (FULL ENTERPRISE EDITION) */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 ml-1">
                System Role (Access Level)
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={!!initialData?.id}
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-slate-700"
              >
                <option value="TENANT_ADMIN">
                  Clinic Manager (Full Access)
                </option>
                <option value="DOCTOR">
                  Doctor (Own appointments, customers, sales)
                </option>
                <option value="STAFF">
                  Secretary (Appointments, customers, sales)
                </option>
                <option value="NURSE">
                  Nurse / Assistant (Team list only, no login.)
                </option>
              </select>
              {formData.role === "NURSE" && !initialData?.id && (
                <p className="text-xs text-slate-500 ml-1 mt-1">
                  Nurses appear in the staff list but don't get a login account
                  or password.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-all"
            >
              Cancel
            </button>
            <Button
              type="submit"
              icon={initialData ? Save : UserPlus}
              isLoading={createLoading || updateLoading}
            >
              {createLoading || updateLoading
                ? "Saving…"
                : initialData
                  ? "Save changes"
                  : "Add staff member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffModal;
