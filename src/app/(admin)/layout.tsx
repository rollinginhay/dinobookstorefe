"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();

  /* ---------------------------------------------
     ROUTE-SPECIFIC CONTENT WIDTH
     --------------------------------------------- */
  const getRouteSpecificStyles = () => {
    // Những trang cần full-width như LightBee
    const fullWidthRoutes = ["/bill", "/pos", "/statistics"];

    if (fullWidthRoutes.some((r) => pathname.startsWith(r))) {
      return "px-6 py-6"; // không giới hạn max-width
    }

    // Các trang còn lại giữ layout 6xl giống LightBee
    return "px-6 py-6 max-w-6xl mx-auto";
  };

  /* ---------------------------------------------
     MAIN CONTENT MARGIN LEFT
     --------------------------------------------- */
  const mainContentMargin =
    isMobileOpen
      ? "ml-0"
      : isExpanded || isHovered
      ? "xl:ml-[280px]"
      : "xl:ml-[88px]";

  return (
    <div className="min-h-screen xl:flex bg-gray-50">
      {/* Sidebar */}
      <AppSidebar />
      <Backdrop />

      {/* MAIN AREA */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />

        {/* PAGE CONTENT */}
        <div className={getRouteSpecificStyles()}>{children}</div>
      </div>
    </div>
  );
}
