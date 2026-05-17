import { NextRequest, NextResponse } from "next/server";

export function checkAdminAuth(req: NextRequest): NextResponse | null {
  const key = req.headers.get("x-admin-key");
  if (key !== "admin-authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
