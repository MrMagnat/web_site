import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin — Андруа Фамиль" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
