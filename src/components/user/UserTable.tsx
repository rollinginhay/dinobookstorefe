import Link from "next/link";
import { User } from "./user.types";
import { getRoleDisplayName } from "@/lib/user/role.utils";

export default function UserTable({ data }: { data: User[] }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 text-sm">
          <tr>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Tên người dùng</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Họ tên</th>
            <th className="px-4 py-3 text-left">Số điện thoại</th>
            <th className="px-4 py-3 text-left">Vai trò</th>
            <th className="px-4 py-3 text-center">Trạng thái</th>
            <th className="px-4 py-3 text-center">Hành động</th>
          </tr>
        </thead>

        <tbody>
          {data.map((user) => (
            <tr key={user.id} className="border-t text-sm hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-700">
                #{user.id}
              </td>

              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{user.username}</div>
              </td>

              <td className="px-4 py-3 text-gray-700">{user.email || "-"}</td>

              <td className="px-4 py-3 text-gray-700">{user.personName || "-"}</td>

              <td className="px-4 py-3 text-gray-700">{user.phoneNumber || "-"}</td>

              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role.id}
                        className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium"
                      >
                        {getRoleDisplayName(role.name)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">Chưa có vai trò</span>
                  )}
                </div>
              </td>

              <td className="px-4 py-3 text-center">
                {user.enabled ? (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                    Hoạt động
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                    Vô hiệu hóa
                  </span>
                )}
              </td>

              <td className="px-4 py-3 text-center">
                <Link
                  href={`/users/${user.id}`}
                  className="inline-flex items-center justify-center text-orange-500 hover:text-orange-600 transition-colors"
                  title="Chỉnh sửa"
                >
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

