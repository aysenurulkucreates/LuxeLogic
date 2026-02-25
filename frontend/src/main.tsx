import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context"; // Token eklemek için bu paket lazım

// 1. Backend bağlantı adresimiz
const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

// 2. Her isteğe token ekleyen "gözlük" yapısı
const authLink = setContext((_, { headers }) => {
  // localStorage'dan token'ı alıyoruz
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "", // Token varsa "Bearer XXXXX" olarak ekle
    },
  };
});

// 3. Client'ı hem bağlantı (httpLink) hem de token (authLink) ile birleştiriyoruz
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
);
