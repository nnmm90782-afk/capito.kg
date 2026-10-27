"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin-login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
      style={{
        color: "#f87171",
        border: "1px solid rgba(239,68,68,0.25)",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <LogOut size={12} />
      Выйти
    </button>
  );
}
