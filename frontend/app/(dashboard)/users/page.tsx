"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function UsersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Usuarios</h1>
      {/* TODO: UserTable component (admin only) */}
      <p className="text-gray-500">User management</p>
    </div>
  );
}
