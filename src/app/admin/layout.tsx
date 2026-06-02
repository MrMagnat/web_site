import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin — Андруа Фамиль" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#FAFAFA" }}>
      <AdminSidebar />
      <main className="min-h-screen md:ml-[240px] pt-[72px] md:pt-8 px-4 md:px-8 pb-12">
        {children}
      </main>
    </div>
  );
}
