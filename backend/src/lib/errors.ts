import { GraphQLError } from "graphql";

export function unauthenticated(message = "Please sign in.") {
  return new GraphQLError(message, { extensions: { code: "UNAUTHENTICATED" } });
}

export function forbidden(message = "You don't have permission to do this.") {
  return new GraphQLError(message, { extensions: { code: "FORBIDDEN" } });
}

export function badInput(message: string) {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}
