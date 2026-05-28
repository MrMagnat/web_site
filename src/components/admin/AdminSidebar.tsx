"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingBag,
  RotateCcw,
  Link2,
  BarChart2,
  Settings,
  LogOut,
  FileText,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Товары", href: "/admin/products", icon: Package },
  { label: "Категории", href: "/admin/categories", icon: FolderOpen },
  { label: "Заказы", href: "/admin/orders", icon: ShoppingBag },
  { label: "Возвраты", href: "/admin/returns", icon: RotateCcw },
  { label: "UTM-метки", href: "/admin/utm", icon: Link2 },
  { label: "Аналитика", href: "/admin/analytics", icon: BarChart2 },
  { label: "Интеграции", href: "/admin/integrations", icon: Settings },
  { label: "Страницы сайта", href: "/admin/pages", icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    router.replace("/admin/login");
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{ width: 240, background: "#191E1B" }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <span
          className="font-prata text-white text-lg leading-tight block"
          style={{ fontFamily: "var(--font-prata, Georgia, serif)" }}
        >
          Андруа Фамиль
        </span>
        <span className="text-xs text-white/40 mt-0.5 block">Панель управления</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-6 py-3 text-sm transition-colors"
              style={{
                background: active ? "#3F1111" : "transparent",
                color: active ? "#FAFAFA" : "rgba(250,250,250,0.6)",
                borderLeft: active ? "3px solid #5a1a1a" : "3px solid transparent",
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded text-sm transition-colors hover:bg-white/10"
          style={{ color: "rgba(250,250,250,0.5)" }}
        >
          <LogOut size={15} strokeWidth={1.8} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
