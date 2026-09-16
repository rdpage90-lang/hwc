import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { NewUserForm } from "@/components/NewUserForm";

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl">Manage users</h1>
        <p className="text-sm text-track-400 mt-1">Create accounts for your group. Admins can create and manage championships; players get read-only access.</p>
      </div>

      <div className="hud-card divide-y divide-track-800">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <div className="text-white text-sm">{u.name}</div>
              <div className="text-xs text-track-500">{u.email}</div>
            </div>
            <Badge tone={u.role === "ADMIN" ? "heat" : "neutral"}>{u.role}</Badge>
          </div>
        ))}
      </div>

      <NewUserForm />
    </div>
  );
}
