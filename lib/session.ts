import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  status = 401;
}
export class ForbiddenError extends Error {
  status = 403;
}

/** Throws if there's no signed-in user. Use inside API route handlers. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError("Not signed in");
  return session.user;
}

/**
 * Throws unless the signed-in user is an ADMIN. Every mutating endpoint
 * (create championship, add driver, submit results, manage users) goes
 * through this — players are read-only everywhere per spec section 3.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new ForbiddenError("Admin access required");
  return user;
}
