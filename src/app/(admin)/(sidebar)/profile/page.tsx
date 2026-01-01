//profile/page.tsx
// 'use client';

// import UserAddressCard from "@/components/user-profile/UserAddressCard";
// import UserInfoCard from "@/components/user-profile/UserInfoCard";
// import UserMetaCard from "@/components/user-profile/UserMetaCard";
// import {Metadata} from "next";
// import React from "react";
// import { useQuery } from '@tanstack/react-query';
// import { UserApi } from "../../../../lib/apis/user.api";


// export const metadata: Metadata = {
//   title: "Next.js Profile | TailAdmin - Next.js Dashboard Template",
//   description:
//     "This is Next.js Profile page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
// };

// // export default function Profile() {
// //   return (
// //     <div>
// //       <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
// //         <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
// //           Profile
// //         </h3>
// //         <div className="space-y-6">
// //           <UserMetaCard />
// //           <UserInfoCard />
// //           <UserAddressCard />
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
'use client';

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";

import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";

import { fetchUserById } from "@/lib/user/user.api";

export default function Profile() {
  const { user: currentUser } = useAuth();
  
  // Lấy user ID từ current user
  const { data: user, isLoading } = useQuery({
    queryKey: ["user", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) {
        // Fallback: tìm bằng email nếu không có id
        if (!currentUser?.email) return null;
        
        const { fetchUsers } = await import("@/lib/user/user.api");
        const users = await fetchUsers();
        const foundUser = users.find((u: any) => 
          u.attributes?.email === currentUser.email
        );
        
        if (foundUser) {
          return await fetchUserById(foundUser.id);
        }
        return null;
      }
      
      return await fetchUserById(currentUser.id);
    },
    enabled: !!currentUser,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
        <p className="text-gray-500">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
        <p className="text-gray-500">Không tìm thấy thông tin người dùng</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Hồ sơ cá nhân
        </h3>

        <div className="space-y-6">
          <UserMetaCard user={user} />
          <UserInfoCard user={user} />
          <UserAddressCard user={user} />
        </div>
      </div>
    </div>
  );
}

