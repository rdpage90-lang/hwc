import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";

// Public route (allowed through middleware.ts) — there is no logged-in user
// here, because the whole point is that the person can't log in. The gate is
// RESET_KEY, a secret that only exists in the deployment's environment
// variables. If it isn't set, the feature is off entirely.
const resetSchema = z
  .object({
    email: z.string().trim().email("Enter the account's email address."),
    resetKey: z.string().min(1, "Enter the reset key."),
    // bcrypt only looks at the first 72 bytes, so longer passwords would be
    // silently truncated — cap it rather than pretend otherwise.
    password: z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "The two passwords don't match.",
    path: ["confirmPassword"],
  });

function keysMatch(provided: string, expected: string) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  return apiHandler(async () => {
    const expectedKey = process.env.RESET_KEY;
    if (!expectedKey) throw new DomainError("Password reset isn't enabled.", 404);

    const parsed = resetSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new DomainError(parsed.error.issues[0]?.message ?? "Check the details and try again.", 400);
    }
    const { email, resetKey, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
    const keyOk = keysMatch(resetKey, expectedKey);

    // Same message whether the email or the key was wrong, so this can't be
    // used to find out which emails have accounts.
    if (!user || !keyOk) throw new DomainError("That email or reset key isn't right.", 403);

    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ ok: true });
  });
}
