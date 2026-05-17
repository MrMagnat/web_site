"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAdminAuth() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
    }
  }, [router]);

  function getAuthHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "x-admin-key": localStorage.getItem("admin_token") ?? "",
    };
  }

  function logout() {
    localStorage.removeItem("admin_token");
    router.replace("/admin/login");
  }

  return { getAuthHeaders, logout };
}
