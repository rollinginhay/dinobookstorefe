"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";

interface TableActionButtonsProps {
    viewLink: string;
    onDelete: () => Promise<void> | void;
    onEdit: () => Promise<void> | void;
}


export default function TableActionButtons({viewLink, onDelete, onEdit}: TableActionButtonsProps) {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        try {
            onDelete();
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            {/* View */}
            <button
                type="button"
                className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 transition"
                onClick={() => router.push(viewLink)}
            >
                View
            </button>

            {/* Create */}
            <button
                type="button"
                className="rounded bg-emerald-500 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-600 transition"
                onClick={onEdit}
            >
                Edit
            </button>

            {/* Delete */}
            <button
                type="button"
                className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition"
                onClick={() => setShowConfirm(true)}
            >
                Delete
            </button>

            {showConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-80">
                        <p className="text-sm text-gray-700 mb-4">
                            Are you sure you want to delete this item?
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className={`rounded px-3 py-1 text-sm text-white ${
                                    isDeleting
                                        ? "bg-red-300 cursor-not-allowed"
                                        : "bg-red-500 hover:bg-red-600"
                                } transition`}
                            >
                                {isDeleting ? "Deleting..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
