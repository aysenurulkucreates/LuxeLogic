import { useState } from "react";
import { useMutation } from "@apollo/client";
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
  });

  const [createStaff, { loading: createLoading }] = useMutation(CREATE_STAFF, {
    refetchQueries: [{ query: GET_MY_STAFF }],
    onCompleted: () => {
      onClose();
      setFormData(initialFormState); // 🧼 Tertemiz resetleme
    },
  });

  const [updateStaff, { loading: updateLoading }] = useMutation(UPDATE_STAFF, {
    refetchQueries: [{ query: GET_MY_STAFF }],
    onCompleted: () => onClose(),
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    // Checkbox (isActive) için özel müdahale 💉
    const finalValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const variables = {
      input: {
        ...formData,
        // Backend beklentisine göre gerekirse burada veri tip dönüşümü yapabilirsin
      },
    };

    if (initialData?.id) {
      await updateStaff({
        variables: { id: initialData.id, ...variables },
      });
    } else {
      await createStaff({ variables });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <form onSubmit={handleSubmit} className="p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {initialData ? "🩺 Edit Professional" : "➕ Add New Professional"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 📝 Name Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Full Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* 📧 Email Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* 📞 Phone Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Phone
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* 🎓 Expertise Select/Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Expertise
              </label>
              <input
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                className="p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* 💡 Buraya workDays için çoklu seçim eklenebilir */}

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || updateLoading}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {createLoading || updateLoading
                ? "Processing..."
                : initialData
                  ? "Update Team Member"
                  : "Save Professional"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffModal;
