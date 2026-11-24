import { useState } from "react";
import { useMutation, type ApolloError } from "@apollo/client";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import { UPDATE_USER_MUTATION } from "../../graphql/mutations/auth";
import { GET_ME } from "../../graphql/queries/auth";

interface ProfileSettingsFormProps {
  currentEmail: string;
}

const inputClasses =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";

// Sunucudan gelen okunabilir mesajı (BAD_USER_INPUT vb.) öne çıkar;
// ağ hatalarında genel bir mesaja düş.
const getErrorMessage = (error: ApolloError): string =>
  error.graphQLErrors[0]?.message ??
  "Could not update your profile. Please try again.";

const ProfileSettingsForm = ({ currentEmail }: ProfileSettingsFormProps) => {
  const [email, setEmail] = useState(currentEmail);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [updateUser, { loading }] = useMutation(UPDATE_USER_MUTATION, {
    refetchQueries: [{ query: GET_ME }],
    onCompleted: (data) => {
      setNewPassword("");
      setCurrentPassword("");
      setEmail(data.updateUser.email);
      setFormError(null);
      toast.success("Profile updated.");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const trimmedEmail = email.trim();
  const emailChanged = trimmedEmail !== "" && trimmedEmail !== currentEmail;
  const passwordChanged = newPassword !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!emailChanged && !passwordChanged) {
      setFormError("Change your email or password to update your profile.");
      return;
    }

    // Boş string = "değişmedi" (backend sözleşmesi).
    void updateUser({
      variables: {
        input: {
          email: emailChanged ? trimmedEmail : "",
          password: newPassword,
          currentPassword,
        },
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div className="space-y-2">
        <label
          htmlFor="profile-email"
          className="text-sm font-semibold text-slate-700"
        >
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="profile-new-password"
          className="text-sm font-semibold text-slate-700"
        >
          New password{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="profile-new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Leave blank to keep your current password"
          className={inputClasses}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="profile-current-password"
          className="text-sm font-semibold text-slate-700"
        >
          Current password
        </label>
        <input
          id="profile-current-password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClasses}
        />
      </div>

      {formError && (
        <p
          role="alert"
          className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {formError}
        </p>
      )}

      <Button type="submit" icon={Save} isLoading={loading}>
        Save changes
      </Button>
    </form>
  );
};

export default ProfileSettingsForm;
