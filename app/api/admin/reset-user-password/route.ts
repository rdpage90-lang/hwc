import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

// Deliberately a flat route (user id in the body) rather than
// /api/admin/users/[id]/..., so it can't clash with any dynamic-segment
// naming already used under app/api/admin.
const resetUserPasswordSchema = z
  .object({
    userId: z.string().min(1, "Pick a user."),
    // bcrypt only looks at the first 72 bytes, so cap it rather than
    // silently truncating a longer password.
    password: z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "The two passwords don't match.",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

// Deliberately a flat route (user id in the body) rather than
// /api/admin/users/[id]/..., so it can't clash with any dynamic-segment
// naming already used under app/api/admin.
const resetUserPasswordSchema = z
  .object({
    userId: z.string().min(1, "Pick a user."),
    // bcrypt only looks at the first 72 bytes, so cap it rather than
    // silently truncating a longer password.
    password: z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "The two passwords don't match.",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  return apiHandler(async () => {
    await requireAdmin();

    const parsed = resetUserPasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new DomainError(parsed.error.issues[0]?.message ?? "Check the details and try again.", 400);
    }
    const { userId, password } = parsed.data;

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new DomainError("User not found", 404);

    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ ok: true });
  });
}

  return apiHandler(async () => {
    await requireAdmin();

    const parsed = resetUserPasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new DomainError(parsed.error.issues[0]?.message ?? "Check the details and try again.", 400);
    }
    const { userId, password } = parsed.data;

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new DomainError("User not found", 404);

    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ ok: true });
  });
}
