"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAFAFA" }}>
      <AdminSidebar />
      <main
        className="min-h-screen"
        style={{ marginLeft: 240, padding: "32px 32px 48px" }}
      >
        {children}
      </main>
    </div>
  );
}
