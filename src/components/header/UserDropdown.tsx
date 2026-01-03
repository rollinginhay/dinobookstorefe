"use client";
import Image from "next/image";
import {useRouter} from "next/navigation";
import React, {useState} from "react";
import {Dropdown} from "../ui/dropdown/Dropdown";
import {DropdownItem} from "../ui/dropdown/DropdownItem";
import {useAuth} from "@/context/auth-context";

export default function UserDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout, isAdmin } = useAuth();
    const router = useRouter();

    function toggleDropdown() {
        setIsOpen(!isOpen);
    }

    function closeDropdown() {
        setIsOpen(false);
    }

    const handleLogout = () => {
        closeDropdown();
        logout();
        router.push("/login");
    };

    return (
        <div className="relative">
            <button
                onClick={toggleDropdown}
                className="flex items-center dropdown-toggle text-gray-700 dark:text-gray-400 dropdown-toggle"
            >
                <span className="overflow-hidden rounded-full h-10 w-10 border-2 border-gray-200 dark:border-gray-700">
                    <Image
                        width={40}
                        height={40}
                        src="/images/user/user-37.jpg"
                        alt="User"
                        className="object-cover"
                    />
                </span>
            </button>

            <Dropdown
                isOpen={isOpen}
                onClose={closeDropdown}
                className="absolute right-0 mt-2 flex w-[240px] flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-800 dark:bg-gray-900"
            >
                {user && (
                    <div className="pb-3 border-b border-gray-200 dark:border-gray-800">
                        <span className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                            {user.username || user.email?.split("@")[0] || "User"}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                        </span>
                    </div>
                )}

                <ul className="flex flex-col gap-1 pt-3 pb-2">
                    <li>
                        <DropdownItem
                            onItemClick={closeDropdown}
                            tag="a"
                            href="/profile"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            <svg
                                className="w-5 h-5 fill-gray-500 dark:fill-gray-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25Z"
                                />
                            </svg>
                            Hồ sơ cá nhân
                        </DropdownItem>
                    </li>
                    <li>
                        <DropdownItem
                            onItemClick={closeDropdown}
                            tag="a"
                            href="/change-password"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            <svg
                                className="w-5 h-5 fill-gray-500 dark:fill-gray-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M10.4858 3.5L13.5182 3.5C13.9233 3.5 14.2518 3.82851 14.2518 4.23377C14.2518 5.9529 16.1129 7.02795 17.602 6.1682C17.9528 5.96567 18.4014 6.08586 18.6039 6.43667L20.1203 9.0631C20.3229 9.41407 20.2027 9.86286 19.8517 10.0655C18.3625 10.9253 18.3625 13.0747 19.8517 13.9345C20.2026 14.1372 20.3229 14.5859 20.1203 14.9369L18.6039 17.5634C18.4013 17.9142 17.9528 18.0344 17.602 17.8318C16.1129 16.9721 14.2518 18.0471 14.2518 19.7663C14.2518 20.1715 13.9233 20.5 13.5182 20.5H10.4858C10.0804 20.5 9.75182 20.1714 9.75182 19.766C9.75182 18.0461 7.88983 16.9717 6.40067 17.8314C6.04945 18.0342 5.60037 17.9139 5.39767 17.5628L3.88167 14.937C3.67903 14.586 3.79928 14.1372 4.15026 13.9346C5.63949 13.0748 5.63946 10.9253 4.15025 10.0655C3.79926 9.86282 3.67901 9.41401 3.88165 9.06303L5.39764 6.43725C5.60034 6.08617 6.04943 5.96581 6.40065 6.16858C7.88982 7.02836 9.75182 5.9539 9.75182 4.23399C9.75182 3.82862 10.0804 3.5 10.4858 3.5Z"
                                />
                            </svg>
                            Đổi mật khẩu
                        </DropdownItem>
                    </li>
                </ul>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 mt-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                    <svg
                        className="w-5 h-5 fill-red-600 dark:fill-red-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
                        />
                    </svg>
                    Đăng xuất
                </button>
            </Dropdown>
        </div>
    );
}
