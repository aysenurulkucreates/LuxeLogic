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

export const tooManyRequests = (retryAfterSeconds: number) => {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return new GraphQLError(
    `Too many login attempts. Please try again in ${minutes} minute(s).`,
    {
      extensions: { code: "TOO_MANY_REQUESTS", retryAfter: retryAfterSeconds },
    },
  );
};
