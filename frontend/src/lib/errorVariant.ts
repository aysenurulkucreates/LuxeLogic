import { ApolloError } from "@apollo/client";

export type ErrorVariant = "network" | "server" | "auth";

const AUTH_ERROR_CODES = new Set(["UNAUTHENTICATED", "FORBIDDEN"]);

export function getErrorVariant(error: unknown): ErrorVariant {
  if (error instanceof ApolloError) {
    if (error.networkError) return "network";

    const hasAuthCode = error.graphQLErrors.some((graphQLError) =>
      AUTH_ERROR_CODES.has(String(graphQLError.extensions?.code)),
    );
    if (hasAuthCode) return "auth";
  }

  return "server";
}
