"use client";

import { usePathname } from "next/navigation";
import FooterSection from "@/components/footer";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/x-admin")) return null;
  return <FooterSection />;
}
