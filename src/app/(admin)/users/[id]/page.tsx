"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import UserForm from "@/components/user/UserForm";
import { fetchUserById } from "@/lib/user/user.api";
import { mapUser } from "@/lib/user/user.mapper";
import { toast } from "sonner";

export default function EditUserPage() {
  const params = useParams();
  const id = params.id as string;
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const res = await fetchUserById(id);
        // Pass both raw response and mapped data so form can access both formats
        const mapped = mapUser(res);
        setInitialData({
          ...res, // Keep raw response for attributes access
          ...mapped, // Add mapped data for direct access
        });
      } catch (err: any) {
        console.error("Error fetching user:", err);
        const errorMessage =
          err?.response?.data?.errors?.[0]?.title ||
          err?.response?.data?.errors?.[0]?.detail ||
          "Có lỗi xảy ra khi tải thông tin người dùng";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadUser();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-gray-500">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-red-500 mb-4">Không tìm thấy người dùng</p>
        </div>
      </div>
    );
  }

  return <UserForm mode="edit" initialData={initialData} />;
}

