"use client";
import CartDrawer from "./CartDrawer";

// Thin client wrapper so CartDrawer can be imported in a server layout
export default function CartDrawerWrapper() {
  return <CartDrawer />;
}
