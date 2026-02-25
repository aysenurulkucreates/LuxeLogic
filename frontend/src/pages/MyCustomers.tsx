import { gql, useQuery } from "@apollo/client";

const GET_MY_CUSTOMERS = gql`
  query GetMyCustomers {
    myCustomers {
      id
      name
      email
      phone
    }
  }
`;

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: number;
}

const MyCustomers = () => {
  // 2. Apollo hook'u ile backend'e sesleniyoruz
  const { loading, error, data } = useQuery(GET_MY_CUSTOMERS);

  // Veri henüz yoldayken (Paramedik telsiz beklerken gibi)
  if (loading)
    return <p className="text-center mt-10">Customers loading... 🚑</p>;

  // Bir hata oluştuysa (Muhtemelen "Giriş yapmalısın" diyecek)
  if (error)
    return (
      <div className="text-center mt-10 text-red-500">
        <p>Error occured: {error.message}</p>
      </div>
    );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-indigo-700">
        My Customer List
      </h1>

      <div className="grid gap-4">
        {data.myCustomers.map((customer: Customer) => (
          <div
            key={customer.id}
            className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500"
          >
            <h3 className="font-bold text-lg">{customer.name}</h3>
            <p className="text-gray-600">
              {customer.email} | {customer.phone}
            </p>
          </div>
        ))}

        {data.myCustomers.length === 0 && (
          <p className="text-gray-500 italic">
            No registered customers have been found yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default MyCustomers;
