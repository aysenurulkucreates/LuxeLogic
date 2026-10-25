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
import { onError } from "@apollo/client/link/error";
import { from } from "@apollo/client";
import { AuthProvider } from "./context/AuthContext";
import { endSession, isTokenExpired } from "./lib/session";

// Süresi dolmuş token ile açılışta hiç istek atılmasın.
const storedToken = localStorage.getItem("token");
if (storedToken && isTokenExpired(storedToken)) {
  localStorage.removeItem("token");
}

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

// 3. Backend UNAUTHENTICATED dönerse oturumu kapat ve giriş sayfasına gönder
const errorLink = onError(({ graphQLErrors }) => {
  if (graphQLErrors?.some((e) => e.extensions?.code === "UNAUTHENTICATED")) {
    endSession();
  }
});

// 4. Client'ı hata, token (authLink) ve bağlantı (httpLink) ile birleştiriyoruz
const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ApolloProvider>
  </React.StrictMode>,
);
