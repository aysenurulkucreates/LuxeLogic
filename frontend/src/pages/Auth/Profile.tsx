import { useQuery } from "@apollo/client";
import { User, Mail, Shield, Building, Camera } from "lucide-react";
import { GET_ME } from "../../graphql/queries/auth";

const ProfilePage = () => {
  const { data, loading, error } = useQuery(GET_ME);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error)
    return (
      <div className="p-8 text-red-500">An error occured: {error.message}</div>
    );

  const me = data?.me;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">User Profile</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Üst Kısım / Header */}
        <div className="h-32 bg-linear-to-r from-indigo-500 to-purple-600"></div>

        <div className="px-8 pb-8">
          {/* 🩺 YENİ: Etkileşimli Profil Fotoğrafı Alanı */}
          <div className="relative -mt-12 mb-6 group w-24">
            <label className="cursor-pointer block relative">
              <div className="h-24 w-24 rounded-2xl bg-white shadow-md border-4 border-white text-indigo-600 flex items-center justify-center overflow-hidden">
                {/* Eğer resim varsa göster, yoksa ikon göster */}
                {me?.profileImage ? (
                  <img
                    src={me.profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={48} />
                )}

                {/* Hover olunca çıkan kamera ikonu */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Camera size={24} className="text-white" />
                </div>
              </div>

              {/* Gizli Input: Resme tıklayınca burası tetiklenir */}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) console.log("Seçilen dosya bbeişim:", file.name);
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sol Kolon: Temel Bilgiler */}
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="flex items-center mt-1 text-gray-700">
                  <Mail size={18} className="mr-2 text-indigo-400" />
                  <span className="font-medium">{me?.email}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Access Level (Role)
                </label>
                <div className="flex items-center mt-1">
                  <Shield size={18} className="mr-2 text-indigo-400" />
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      me?.role === "SUPER_ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {me?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Sağ Kolon: Şirket Bilgileri */}
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Organization Info
                </label>
                <div className="flex items-center text-gray-700">
                  <Building size={18} className="mr-2 text-indigo-400" />
                  <span className="font-semibold text-sm">
                    {me?.tenant?.name || "Luxe Clinic"}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1 font-mono pl-7">
                  ID: {me?.tenantId}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
