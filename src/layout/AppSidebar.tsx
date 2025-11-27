"use client";
import React, { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import TagIcon from "@/icons/TagIcon";
import {
    AiIcon,
    BoxCubeIcon,
    CalenderIcon,
    CallIcon,
    CartIcon,
    ChatIcon,
    ChevronDownIcon,
    GridIcon,
    HorizontaLDots,
    ListIcon,
    MailIcon,
    PageIcon,
    PieChartIcon,
    PlugInIcon,
    TableIcon,
    TaskIcon,
    UserCircleIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  { name: "Thống kê", icon: <PieChartIcon />, path: "/statistics" },
  { name: "Bán hàng tại quầy", icon: <CartIcon />, path: "/pos" },
  { name: "Danh sách hóa đơn", icon: <TableIcon />, path: "/bill" },
  { name: "Phiếu giảm giá", icon: <TagIcon className="w-5 h-5" />, path: "/voucher" },
  {
    name: "Thương mại điện tử",
    icon: <CartIcon />,
    new: true,
    subItems: [
      { name: "Thuộc tính sách", path: "/book-property-list" },
      { name: "Danh sách sách", path: "/book-list" },
      { name: "Thêm sách", path: "/add-product" },
    ],
  },
  { name: "Người dùng", icon: <UserCircleIcon />, path: "/profile" },
  {
    name: "Biểu mẫu",
    icon: <ListIcon />,
    subItems: [
      { name: "Form cơ bản", path: "/form-elements" },
      { name: "Bố cục form", path: "/form-layout" },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts" },
      { name: "Avatar", path: "/avatars" },
      { name: "Badge", path: "/badge" },
      { name: "Breadcrumb", path: "/breadcrumb" },
      { name: "Buttons", path: "/buttons" },
      { name: "Buttons Group", path: "/buttons-group" },
      { name: "Cards", path: "/cards" },
      { name: "Carousel", path: "/carousel" },
      { name: "Dropdowns", path: "/dropdowns" },
      { name: "Images", path: "/images" },
      { name: "Links", path: "/links" },
      { name: "List", path: "/list" },
      { name: "Modals", path: "/modals" },
      { name: "Notification", path: "/notifications" },
      { name: "Pagination", path: "/pagination" },
      { name: "Popovers", path: "/popovers" },
      { name: "Progressbar", path: "/progress-bar" },
      { name: "Ribbons", path: "/ribbons" },
      { name: "Spinners", path: "/spinners" },
      { name: "Tabs", path: "/tabs" },
      { name: "Tooltips", path: "/tooltips" },
      { name: "Videos", path: "/videos" },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin" },
      { name: "Sign Up", path: "/signup" },
      { name: "Reset Password", path: "/reset-password" },
      { name: "Two Step Verification", path: "/two-step-verification" },
    ],
  },
];

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{ type: string; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => path === pathname,
    [pathname]
  );

  useEffect(() => {
    if (!isExpanded && !isHovered && !isMobileOpen) {
      setOpenSubmenu(null);
    }
  }, [isExpanded, isHovered, isMobileOpen]);

  useEffect(() => {
    if (!openSubmenu) return;
    const key = `${openSubmenu.type}-${openSubmenu.index}`;
    const el = subMenuRefs.current[key];
    if (el) {
      setSubMenuHeight((prev) => ({
        ...prev,
        [key]: el.scrollHeight,
      }));
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, type: string) => {
    setOpenSubmenu((prev) =>
      prev && prev.index === index && prev.type === type ? null : { type, index }
    );
  };

  const renderMenu = (items: NavItem[], type: string) => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, type)}
              className={`menu-item group 
                  ${openSubmenu?.type === type && openSubmenu.index === index ? "menu-item-active" : "menu-item-inactive"}
                  ${isExpanded || isHovered || isMobileOpen ? "justify-start" : "justify-center"}`}
            >
              <span
                className={`${
                  openSubmenu?.type === type && openSubmenu.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}

              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform ${
                    openSubmenu?.type === type && openSubmenu.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                } ${isExpanded || isHovered || isMobileOpen ? "justify-start" : "justify-center"}`}
              >
                <span
                  className={
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }
                >
                  {nav.icon}
                </span>

                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el: HTMLDivElement | null) => {
  subMenuRefs.current[`${type}-${index}`] = el;
}}

              className="overflow-hidden transition-all"
              style={{
                height:
                  openSubmenu?.type === type && openSubmenu.index === index
                    ? subMenuHeight[`${type}-${index}`]
                    : 0,
              }}
            >
              <ul className="mt-2 space-y-1 pl-6">
                {nav.subItems.map((s) => (
                  <li key={s.name}>
                    <Link
                      href={s.path}
                      className={`menu-dropdown-item ${
                        isActive(s.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`
        sidebar-fahasa fixed flex flex-col top-0 left-0 px-5 
        ${isExpanded || isMobileOpen || isHovered ? "w-[280px]" : "w-[90px]"}
        transition-all duration-300
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${isExpanded || isHovered || isMobileOpen ? "justify-start" : "xl:justify-center"}`}>
        <Link href="/">
          {(isExpanded || isHovered || isMobileOpen) ? (
            <>
              <Image src="/images/logo/logo.svg" alt="Logo" width={150} height={40} className="dark:hidden" />
              <Image src="/images/logo/logo-dark.svg" alt="Logo" width={150} height={40} className="hidden dark:block" />
            </>
          ) : (
            <Image src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${
                isExpanded || isHovered || isMobileOpen ? "justify-start" : "xl:justify-center"
              }`}>
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
              </h2>

              {renderMenu(navItems, "main")}
            </div>

            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${
                isExpanded || isHovered || isMobileOpen ? "justify-start" : "xl:justify-center"
              }`}>
                {isExpanded || isHovered || isMobileOpen ? "Others" : <HorizontaLDots />}
              </h2>

              {renderMenu(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
