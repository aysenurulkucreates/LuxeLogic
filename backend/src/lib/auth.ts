import { myContext, Role, AuthUser, Db } from "../context/context.js";
import { unauthenticated, forbidden } from "./errors.js";

export function requireAuth(user: myContext["user"]): AuthUser {
  if (!user) throw unauthenticated();
  return user;
}

export function requireRole(user: myContext["user"], roles: Role[]): AuthUser {
  const me = requireAuth(user);
  if (!roles.includes(me.role)) throw forbidden();
  return me;
}

// Hata fırlatmadan dönerse, TypeScript bu satırdan sonra db'yi null değil kabul eder.
export function assertDb(db: myContext["db"]): asserts db is Db {
  if (!db) throw unauthenticated();
}
