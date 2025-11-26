"use client";
import React, {useRef, useState} from "react";

interface ImageDropZoneProps {
    existingImageUrl?: string;
    onFileChange: (file: File | null) => void;
    rows?: number;
}

export default function ImagePicker({
                                          existingImageUrl,
                                          onFileChange,
                                          rows = 6,
                                      }: ImageDropZoneProps) {
    const [preview, setPreview] = useState(existingImageUrl ?? null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // match your textarea row height
    const heightPx = rows * 20 + 20 + 2;
    const height = `${heightPx}px`;

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        onFileChange(file);
    }

    function handleCancel() {
        setPreview(null);
        onFileChange(null);

        // Clear input value so user can choose the same file again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    return (
        <div style={{ height }} className="w-full">
            {preview ? (
                <div
                    className="relative w-full rounded-lg border border-gray-300 bg-gray-50 overflow-hidden"
                    style={{ height }}
                >
                    <img
                        src={preview}
                        alt="Preview"
                        className="h-full w-full object-contain bg-white"
                    />

                    {/* Replace Button */}
                    <label className="absolute bottom-2 right-2 cursor-pointer rounded-md bg-white px-3 py-1.5 text-sm shadow border hover:bg-gray-100">
                        Replace
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png"
                            className="hidden"
                            onChange={handleFile}
                        />
                    </label>

                    {/* Cancel Button */}
                    <button
                        onClick={handleCancel}
                        className="absolute bottom-2 left-2 rounded-md bg-white px-3 py-1.5 text-sm shadow border hover:bg-gray-100"
                        type="button"
                    >
                        Remove
                    </button>
                </div>
            ) : (
                <label
                    style={{ height }}
                    className="
            flex w-full flex-col items-center justify-center
            rounded-lg border-2 border-dashed border-gray-300
            bg-gray-50 text-gray-500 cursor-pointer transition
            hover:border-blue-400 hover:bg-blue-50/40
          "
                >
                    <div className="mb-2 text-gray-400">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4-4m0 0l-4 4m4-4v12"
                            />
                        </svg>
                    </div>

                    <span className="text-sm font-medium text-gray-700">
            Click to upload or drag and drop
          </span>
                    <span className="text-xs text-gray-400 mt-1">JPG or PNG</span>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={handleFile}
                    />
                </label>
            )}
        </div>
    );
}
