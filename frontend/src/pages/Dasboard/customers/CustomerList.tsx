import { useQuery } from "@apollo/client";
import { UserPlus, Mail, Phone, MoreVertical } from "lucide-react";
import { GET_MY_CUSTOMERS } from "../../../graphql/queries/auth";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string; // Backend'den genelde string gelir, hata alırsan number yaparsın bbeiş
}

const CustomerList = () => {
  const { loading, error, data } = useQuery(GET_MY_CUSTOMERS);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mt-10">
        An error occured: {error.message}
      </div>
    );

  return (
    <div className="p-8">
      {/* Üst Başlık ve Aksiyon Alanı */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Customers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Total of {data?.myCustomers?.length || 0} customers were found.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm font-medium">
          <UserPlus size={18} />
          Add new customer
        </button>
      </div>

      {/* Liste Konteynırı */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tablo Başlıkları */}
        <div className="grid grid-cols-4 bg-gray-50 px-6 py-4 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Customer</span>
          <span>Communicitaion</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {/* Müşteri Satırları */}
        <div className="divide-y divide-gray-50">
          {data?.myCustomers.map((customer: Customer) => (
            <div
              key={customer.id}
              className="grid grid-cols-4 px-6 py-4 items-center hover:bg-indigo-50/30 transition group"
            >
              {/* İsim ve Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  {customer.name.charAt(0)}
                </div>
                <span className="font-semibold text-gray-900">
                  {customer.name}
                </span>
              </div>

              {/* İletişim Bilgileri */}
              <div className="flex flex-col gap-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  {customer.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  {customer.phone}
                </div>
              </div>

              {/* Durum - MANTIK KISMI 1: Burayı Backend'den gelen veriye göre renklendirmeyi dene! */}
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Active
                </span>
              </div>

              {/* İşlemler */}
              <div className="text-right">
                <button className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-indigo-600 transition">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          ))}

          {/* Boş Durum (Empty State) */}
          {data?.myCustomers.length === 0 && (
            <div className="p-20 text-center text-gray-500">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                🔍
              </div>
              <p className="italic">
                You haven't registered any customers yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
