"use client";
import React, {useCallback, useEffect, useRef, useState} from "react";
import Link from "next/link";
import Image from "next/image";
import {usePathname, useRouter} from "next/navigation";
import {useSidebar} from "../context/SidebarContext";
import {useAuth} from "../context/auth-context";
import {
    CallIcon,
    CartIcon,
    ChatIcon,
    ChevronDownIcon,
    HorizontaLDots,
    MailIcon,
    PieChartIcon,
    TableIcon,
    UserCircleIcon,
} from "../icons/index";
import TagIcon from "@/icons/TagIcon";

type NavItem = {
    name: string;
    icon: React.ReactNode;
    path?: string;
    new?: boolean;
    subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// Tất cả menu items (chưa filter theo role)
const allNavItems: NavItem[] = [
    {name: "Thống kê", icon: <PieChartIcon/>, path: "/"},
    {name: "Bán hàng tại quầy", icon: <CartIcon/>, path: "/pos"},
    {name: "Danh sách hóa đơn", icon: <TableIcon/>, path: "/bill"},
    {
        name: "Quản lý sách",
        icon: <CartIcon/>,
        subItems: [
            {name: "Sách", path: "/books"},
            {name: "Nhà xuất bản", path: "/publishers"},
            {name: "Thể loại", path: "/genres"},
            {name: "Tác giả", path: "/creators"},
        ],
    },
    {
        name: "Giảm giá",
        icon: <TagIcon className="w-5 h-5"/>,
        path: "/voucher", // 👈 Chỉ có đợt giảm giá
    },
    {
        name: "Người dùng",
        icon: <UserCircleIcon/>,
        subItems: [
            {name: "Quản lý khách hàng", path: "/users"},
            {name: "Quản lý nhân viên", path: "/users/staff"},
        ],
    },
//   {
//     name: "Biểu mẫu",
//     icon: <ListIcon />,
//     subItems: [
//       { name: "Form cơ bản", path: "/form-elements" },
//       { name: "Bố cục form", path: "/form-layout" },
//     ],
//   },
];

// const othersItems: NavItem[] = [

//     {
//         icon: <BoxCubeIcon/>,
//         name: "UI Elements",
//         subItems: [
//             {name: "Alerts", path: "/alerts"},
//             {name: "Avatar", path: "/avatars"},
//             {name: "Badge", path: "/badge"},
//             {name: "Breadcrumb", path: "/breadcrumb"},
//             {name: "Buttons", path: "/buttons"},
//             {name: "Buttons Group", path: "/buttons-group"},
//             {name: "Cards", path: "/cards"},
//             {name: "Carousel", path: "/carousel"},
//             {name: "Dropdowns", path: "/dropdowns"},
//             {name: "Images", path: "/images"},
//             {name: "Links", path: "/links"},
//             {name: "List", path: "/list"},
//             {name: "Modals", path: "/modals"},
//             {name: "Notification", path: "/notifications"},
//             {name: "Pagination", path: "/pagination"},
//             {name: "Popovers", path: "/popovers"},
//             {name: "Progressbar", path: "/progress-bar"},
//             {name: "Ribbons", path: "/ribbons"},
//             {name: "Spinners", path: "/spinners"},
//             {name: "Tabs", path: "/tabs"},
//             {name: "Tooltips", path: "/tooltips"},
//             {name: "Videos", path: "/videos"},
//         ],
//     },
//     {
//         icon: <PlugInIcon/>,
//         name: "Authentication",
//         subItems: [
//             {name: "Sign In", path: "/signin", pro: false},
//             {name: "Sign Up", path: "/signup", pro: false},
//             {name: "Reset Password", path: "/reset-password"},
//             {
//                 name: "Two Step Verification",
//                 path: "/two-step-verification",
//             },
//         ],
//     },
// ];

const supportItems: NavItem[] = [
    {
        icon: <ChatIcon/>,
        name: "Chat",
        path: "/chat",
    },
    {
        icon: <CallIcon/>,
        name: "Support",
        new: true,
        subItems: [
            {name: "Support List", path: "/support-tickets"},
            {name: "Support Reply", path: "/support-ticket-reply"},
        ],
    },
    {
        icon: <MailIcon/>,
        name: "Email",
        subItems: [
            {name: "Inbox", path: "/inbox"},
            {name: "Details", path: "/inbox-details"},
        ],
    },
];

const AppSidebar: React.FC = () => {
    const {isExpanded, isMobileOpen, isHovered, setIsHovered} = useSidebar();
    const pathname = usePathname();
    const router = useRouter();
    const {logout, isAdmin, isManager, isStaff, isLoading, rolesReady} = useAuth();

    // Filter menu items dựa trên role
    const getFilteredNavItems = (): NavItem[] => {
        // Wait for roles to be loaded
        if (!rolesReady) {
            return [];
        }

        // ROLE_ADMIN: thấy tất cả
        if (isAdmin()) {
            return allNavItems;
        }

        // ROLE_MANAGER: thấy menu quản lý
        if (isManager()) {
            return allNavItems;
        }

        // ROLE_EMPLOYEE (staff): chỉ thấy Bán hàng tại quầy và Danh sách hóa đơn
        if (isStaff()) {
            return allNavItems.filter(item =>
                item.path === "/pos" || item.path === "/bill"
            );
        }

        // ROLE_USER: không thấy sidebar này (trả về empty array)
        return [];
    };

    const navItems = getFilteredNavItems();

    const renderMenuItems = (
        navItems: NavItem[],
        menuType: "main" | "support" | "others"
    ) => (
        <ul className="flex flex-col gap-1">
            {navItems.map((nav, index) => (
                <li key={nav.name}>
                    {nav.subItems ? (
                        <button
                            onClick={() => handleSubmenuToggle(index, menuType)}
                            className={`menu-item group  ${
                                openSubmenu?.type === menuType && openSubmenu?.index === index
                                    ? "menu-item-active"
                                    : "menu-item-inactive"
                            } cursor-pointer ${
                                !isExpanded && !isHovered
                                    ? "lg:justify-center"
                                    : "lg:justify-start"
                            }`}
                        >
              <span
                  className={` ${
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <span className={`menu-item-text`}>{nav.name}</span>
                            )}
                            {nav.new && (isExpanded || isHovered || isMobileOpen) && (
                                <span
                                    className={`ml-auto absolute right-10 ${
                                        openSubmenu?.type === menuType &&
                                        openSubmenu?.index === index
                                            ? "menu-dropdown-badge-active"
                                            : "menu-dropdown-badge-inactive"
                                    } menu-dropdown-badge`}
                                >
                  new
                </span>
                            )}
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <ChevronDownIcon
                                    className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                                        openSubmenu?.type === menuType &&
                                        openSubmenu?.index === index
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
                                }`}
                            >
                <span
                    className={`${
                        isActive(nav.path)
                            ? "menu-item-icon-active"
                            : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className={`menu-item-text`}>{nav.name}</span>
                                )}
                            </Link>
                        )
                    )}
                    {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                        <div
                            ref={(el) => {
                                subMenuRefs.current[`${menuType}-${index}`] = el;
                            }}
                            className="overflow-hidden transition-all duration-300"
                            style={{
                                height:
                                    openSubmenu?.type === menuType && openSubmenu?.index === index
                                        ? `${subMenuHeight[`${menuType}-${index}`]}px`
                                        : "0px",
                            }}
                        >
                            <ul className="mt-2 space-y-1 ml-9">
                                {nav.subItems.map((subItem) => (
                                    <li key={subItem.name}>
                                        <Link
                                            href={subItem.path}
                                            className={`menu-dropdown-item ${
                                                isActive(subItem.path)
                                                    ? "menu-dropdown-item-active"
                                                    : "menu-dropdown-item-inactive"
                                            }`}
                                        >
                                            {subItem.name}
                                            <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                            <span
                                className={`ml-auto ${
                                    isActive(subItem.path)
                                        ? "menu-dropdown-badge-active"
                                        : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge `}
                            >
                            new
                          </span>
                        )}
                                                {subItem.pro && (
                                                    <span
                                                        className={`ml-auto ${
                                                            isActive(subItem.path)
                                                                ? "menu-dropdown-badge-pro-active"
                                                                : "menu-dropdown-badge-pro-inactive"
                                                        } menu-dropdown-badge-pro `}
                                                    >
                            pro
                          </span>
                                                )}
                      </span>
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

    const [openSubmenu, setOpenSubmenu] = useState<{
        type: "main" | "support" | "others";
        index: number;
    } | null>(null);
    const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
        {}
    );
    const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // const isActive = (path: string) => path === pathname;

    const isActive = useCallback((path: string) => path === pathname, [pathname]);

    useEffect(() => {
        // Check if the current path matches any submenu item
        let submenuMatched = false;
        ["main", "support", "others"].forEach((menuType) => {
            // const items =
            //     menuType === "main"
            //         ? navItems
            //         : menuType === "support"
            //             ? supportItems
            //             : othersItems
            //             ;
            // items.forEach((nav, index) => {
            //     if (nav.subItems) {
            //         nav.subItems.forEach((subItem) => {
            //             if (isActive(subItem.path)) {
            //                 setOpenSubmenu({
            //                     type: menuType as "main" | "support" | "others",
            //                     index,
            //                 });
            //                 submenuMatched = true;
            //             }
            //         });
            //     }
            // });
        });

        // If no submenu item matches, close the open submenu
        if (!submenuMatched) {
            setOpenSubmenu(null);
        }
    }, [pathname, isActive]);

    useEffect(() => {
        // Set the height of the submenu items when the submenu is opened
        if (openSubmenu !== null) {
            const key = `${openSubmenu.type}-${openSubmenu.index}`;
            if (subMenuRefs.current[key]) {
                setSubMenuHeight((prevHeights) => ({
                    ...prevHeights,
                    [key]: subMenuRefs.current[key]?.scrollHeight || 0,
                }));
            }
        }
    }, [openSubmenu]);

    const handleSubmenuToggle = (
        index: number,
        menuType: "main" | "support" | "others"
    ) => {
        setOpenSubmenu((prevOpenSubmenu) => {
            if (
                prevOpenSubmenu &&
                prevOpenSubmenu.type === menuType &&
                prevOpenSubmenu.index === index
            ) {
                return null;
            }
            return {type: menuType, index};
        });
    };

    return (
        <aside
            className={`fixed  flex flex-col xl:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-full transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
                isExpanded || isMobileOpen
                    ? "w-[290px]"
                    : isHovered
                        ? "w-[290px]"
                        : "w-[90px]"
            }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`py-8 flex  ${
                    !isExpanded && !isHovered ? "xl:justify-center" : "justify-start"
                }`}
            >
                <Link href="/">
                    {isExpanded || isHovered || isMobileOpen ? (
                        <>
                            <Image
                                className="dark:hidden"
                                src="/images/logo/logo.svg"
                                alt="Logo"
                                width={150}
                                height={40}
                            />
                            <Image
                                className="hidden dark:block"
                                src="/images/logo/logo-dark.svg"
                                alt="Logo"
                                width={150}
                                height={40}
                            />
                        </>
                    ) : (
                        <Image
                            src="/images/logo/logo-icon.svg"
                            alt="Logo"
                            width={32}
                            height={32}
                        />
                    )}
                </Link>
            </div>
            <div className="flex flex-col overflow-y-auto  duration-300 ease-linear no-scrollbar">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            {renderMenuItems(navItems, "main")}
                        </div>
                        {/*<div>*/}
                        {/*  <h2*/}
                        {/*    className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${*/}
                        {/*      !isExpanded && !isHovered*/}
                        {/*        ? "xl:justify-center"*/}
                        {/*        : "justify-start"*/}
                        {/*    }`}*/}
                        {/*  >*/}
                        {/*    {isExpanded || isHovered || isMobileOpen ? (*/}
                        {/*      "Support"*/}
                        {/*    ) : (*/}
                        {/*      <HorizontaLDots />*/}
                        {/*    )}*/}
                        {/*  </h2>*/}
                        {/*  {renderMenuItems(supportItems, "support")}*/}
                        {/*</div>*/}
                    </div>
                </nav>
                {/*{isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}*/}
            </div>

            {/* Logout Button */}
            <div className="mt-auto pb-6 border-t border-gray-200 dark:border-gray-800 pt-4">
                <button
                    onClick={() => {
                        logout();
                        router.push('/login');
                    }}
                    className={`menu-item group menu-item-inactive w-full ${
                        !isExpanded && !isHovered
                            ? "xl:justify-center"
                            : "justify-start"
                    }`}
                >
                    <span className="menu-item-icon-inactive">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="menu-item-text">Đăng xuất</span>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default AppSidebar;
