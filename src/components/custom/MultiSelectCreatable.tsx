"use client";

import React, {useState} from "react";
import Select, {MultiValue, StylesConfig} from "react-select";

// Every property structure (Genre, Series, Author...) must have id + name
export interface BaseProperty {
    type?: string;
    id: string;
    name: string;
}

interface MultiSelectCreatableProps<T extends BaseProperty> {
    property: string;  // still needed for onCreateOption
    options: T[];
    selectedValues: T[];
    onChange: (values: T[]) => void;
    onCreateOption: (property: string, name: string) => void;
    placeholder?: string;
    className?: string;
}

export default function MultiSelectCreatable<T extends BaseProperty>({
                                                                         property,
                                                                         options,
                                                                         selectedValues,
                                                                         onChange,
                                                                         onCreateOption,
                                                                         placeholder = "Select…",
                                                                         className = "",
                                                                     }: MultiSelectCreatableProps<T>) {

    const [createInput, setCreateInput] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const styles: StylesConfig<T, true> = {
        control: (base) => ({
            ...base,
            minHeight: "44px",
            backgroundColor: "transparent",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#9CA3AF",
        }),
    };

    const handleCreate = () => {
        const name = createInput.trim();
        if (!name) return;

        setIsCreating(true);
        try {
            onCreateOption(property, name);
        } finally {
            setCreateInput("");
            setIsCreating(false);
        }
    };

    return (
        <div className={className}>
            {/* Create input */}
            <div className="mb-2 flex gap-2">
                <input
                    value={createInput}
                    onChange={(e) => setCreateInput(e.target.value)}
                    placeholder="Create new item…"
                    className="w-full rounded border px-3 py-2 text-sm"
                    aria-label="Create new item"
                />

                <button
                    onClick={handleCreate}
                    disabled={!createInput.trim() || isCreating}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Add new item"
                    type="button"
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

            {/* Multi Select */}
            <Select<T, true>
                isMulti
                options={options}
                value={selectedValues}
                onChange={(vals: MultiValue<T> | null) => {
                    // MultiValue<T> is readonly array → convert to T[]
                    const next = (vals ?? []).map(v => v);
                    onChange(next);
                }}
                getOptionLabel={(item) => item.name}
                getOptionValue={(item) => String(item.id)}
                placeholder={placeholder}
                styles={styles}
                classNamePrefix="custom"
            />
        </div>
    );
}
