import { useQuery } from "@apollo/client";
import { GET_ME } from "../../graphql/queries/auth";
import { useState } from "react";
import AddCustomerModal from "../../components/shared/AddCustomerModal";

const Overview: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { loading, error, data } = useQuery(GET_ME);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl font-semibold animate-pulse text-blue-600">
          LuxeLogic Loading...
        </p>
      </div>
    );

  if (error) return <p>An error occured: {error.message}</p>;

  if (loading) return <p>Loading...</p>;
  if (!data || !data.me) return <p>Login first.</p>;

  const userName = data.me.email.split("@")[0];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Üst Karşılama Alanı */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {userName}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Take a look at the current state of your clinic.
        </p>
      </div>

      {/* İstatistik Kartları Girdisi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Kart 1: Toplam Müşteri */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">👥</span>
            <span className="text-green-500 text-sm font-medium">+12%</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Customer</h3>
          <p className="text-2xl font-bold text-gray-900">1,284</p>
        </div>

        {/* Kart 2: Günlük Randevu */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              📅
            </span>
            <span className="text-purple-500 text-sm font-medium">Today</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Appointments</h3>
          <p className="text-2xl font-bold text-gray-900">24</p>
        </div>

        {/* --- MANTIK KISMI 2 ---
            Buraya 2 tane daha kart ekleyebilirsin. Örneğin: "Aktif Abonelikler" veya "Bekleyen İşlemler".
            Tasarımı kopyalayıp ikonları ve renkleri değiştirmeyi dene yavrum!
        */}
      </div>

      {/* Alt Bölüm: Son İşlemler ve Hızlı Linkler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Last Customer Transactions
          </h2>

          {/* --- MANTIK KISMI 3 ---
              Aşağıdaki liste şimdilik statik. 
              ÖDEV: Bir gün bu listeyi backend'den gelen "customers" dizisiyle 
              dönmek (mapping) gerekecek. Şimdilik tasarımını gör diye böyle bırakıyorum.
          */}
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Customer name {item}
                    </p>
                    <p className="text-sm text-gray-500">
                      New registration made
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">2 hour ago</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hızlı Aksiyonlar */}
        <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-4">Fast Action</h2>
            <p className="text-blue-100 mb-6">
              You can start the process by creating a new customer registration.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition"
          >
            + Add New Customer
          </button>
        </div>
      </div>
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Overview;
