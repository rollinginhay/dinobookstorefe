"use client";

export default function TableActionButtons() {
    return (
        <div className="flex items-center space-x-2">
            {/* View */}
            <button
                type="button"
                className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 transition"
            >
                View
            </button>

            {/* Create */}
            <button
                type="button"
                className="rounded bg-emerald-500 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-600 transition"
            >
                Create
            </button>

            {/* Delete */}
            <button
                type="button"
                className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition"
            >
                Delete
            </button>
        </div>
    );
}
