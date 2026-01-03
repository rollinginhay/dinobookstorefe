"use client";

import { ReactNode } from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: "blue" | "red" | "green" | "orange";
  loading?: boolean;
  loadingText?: string;
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmButtonColor = "blue",
  loading = false,
  loadingText = "Đang xử lý...",
}: ConfirmDialogProps) {
  console.log("ConfirmDialog render:", { isOpen, loading, onConfirm: typeof onConfirm });
  if (!isOpen) return null;

  const buttonColors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-green-600 hover:bg-green-700",
    orange: "bg-orange-600 hover:bg-orange-700",
  };

  return (
    <>
      {/* Overlay - chỉ che phần main content, không che sidebar (sidebar có z-50) */}
      <div 
        className="fixed inset-0 bg-black/30 flex items-center justify-center z-40"
        onClick={onClose}
      >
        {/* Dialog - click vào dialog không đóng */}
        <div 
          className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl relative z-50"
          onClick={(e) => e.stopPropagation()}
        >
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {title}
        </h3>
        <div className="text-sm text-gray-600 mb-6">
          {message}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-gray-700"
          >
            {cancelText}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("=== ConfirmDialog: Confirm button clicked ===");
              console.log("loading:", loading);
              console.log("onConfirm function:", onConfirm);
              console.log("onConfirm type:", typeof onConfirm);
              if (loading) {
                console.warn("Button is disabled due to loading state");
                return;
              }
              if (!onConfirm) {
                console.error("onConfirm is not defined!");
                return;
              }
              try {
                console.log("Calling onConfirm...");
                onConfirm();
                console.log("onConfirm called successfully");
              } catch (error) {
                console.error("Error calling onConfirm:", error);
              }
            }}
            disabled={loading}
            className={`px-5 py-2.5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium ${buttonColors[confirmButtonColor]}`}
          >
            {loading ? loadingText : confirmText}
          </button>
        </div>
        </div>
      </div>
    </>
  );
}



