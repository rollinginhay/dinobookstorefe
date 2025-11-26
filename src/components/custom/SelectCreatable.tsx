"use client";

import React, {useState} from "react";
import {ChevronDownIcon} from "@/icons";

interface Option {
    id: string | number;
    name: string;
}

interface SelectCreatableProps {
    property: string;                   // same as MultiSelectCreatable
    options: Option[];
    value: Option | null;
    onChange: (value: Option | null) => void;
    onCreateOption: (property: string, name: string) => void;

    placeholder?: string;
    className?: string;
}

export default function SelectCreatable({
                                            property,
                                            options,
                                            value,
                                            onChange,
                                            onCreateOption,

                                            placeholder = "Select…",
                                            className = "",
                                        }: SelectCreatableProps) {
    const [createInput, setCreateInput] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        const name = createInput.trim();
        if (!name) return;

        setIsCreating(true);

        try {
            await onCreateOption(property, name);
        } finally {
            setCreateInput("");
            setIsCreating(false);
        }
    };

    return (
        <div className={className}>

            {/* Create new item row (like MultiSelectCreatable) */}
            <div className="mb-2 flex gap-2">
                <input
                    value={createInput}
                    onChange={(e) => setCreateInput(e.target.value)}
                    placeholder="Create new item…"
                    className="w-full rounded border px-3 py-2 text-sm"
                    aria-label="Create new item"
                />

                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!createInput.trim() || isCreating}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCreating ? (
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"/>
                            <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4"
                                  strokeLinecap="round"/>
                        </svg>
                    ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                    )}
                </button>
            </div>

            {/* The actual TailAdmin Select */}
            <div className="relative">
                <select
                    className={`h-11 w-full appearance-none rounded-lg border border-gray-300 
                      bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs 
                      placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden 
                      focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 
                      dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 
                      dark:focus:border-brand-800 ${className}`}
                    value={value?.id ?? ""}
                    onChange={(e) => {
                        const selected = options.find(o => String(o.id) === e.target.value) || null;
                        onChange(selected);
                    }}
                >
                    {/* Placeholder */}
                    <option value="" disabled>
                        {placeholder}
                    </option>

                    {/* Options */}
                    {options.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.name}
                        </option>
                    ))}
                </select>

                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <ChevronDownIcon />
        </span>
            </div>
        </div>
    );
}
