import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { apiHandler, DomainError } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { createUserSchema } from "@/lib/validations";

export async function GET() {
  return apiHandler(async () => {
    await requireAdmin();
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ users });
  });
}

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    await requireAdmin();
    const body = await req.json();
    const input = createUserSchema.parse(body);

    const existing = await db.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) throw new DomainError("A user with this email already exists.");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await db.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  });
}
