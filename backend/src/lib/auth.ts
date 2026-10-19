import { myContext, Role } from "../context/context.js";
import { unauthenticated, forbidden } from "./errors.js";

type AuthUser = NonNullable<myContext["user"]>;

export function requireAuth(user: myContext["user"]): AuthUser {
  if (!user) throw unauthenticated();
  return user;
}

export function requireRole(user: myContext["user"], roles: Role[]): AuthUser {
  const me = requireAuth(user);
  if (!roles.includes(me.role)) throw forbidden();
  return me;
}
