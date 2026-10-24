import type { Metadata } from "next";
import { cookies } from "next/headers";
import { userFromToken } from "@/lib/db";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminLogin from "@/components/admin/AdminLogin";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "仙籍 · 玩家數據後臺",
  description: "管理員專用玩家數據後臺",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin" },
};

export default async function AdminPage() {
  const user = await userFromToken((await cookies()).get("session")?.value);
  if (!user?.is_admin) return <AdminLogin username={user?.username} />;
  return <AdminDashboard adminName={user.username} />;
}
