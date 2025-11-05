"use client";

import {useState} from "react";

export default function PropertyFilterDropdown() {
    const categories = ["Publisher", "Creator", "Genre", "Series"];
    const [selected, setSelected] = useState(categories[0]);
    const [open, setOpen] = useState(false);

    return (
        <div className="relative inline-block text-left">
            {/* Dropdown button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex justify-between w-44 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
            >
                {selected}
                <span className="ml-2 transition-transform"
                      style={{transform: open ? "rotate(180deg)" : "rotate(0deg)"}}>
          ▼
        </span>
            </button>

            {/* Dropdown menu */}
            {open && (
                <div
                    className="absolute z-10 mt-2 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => {
                                    setSelected(category);
                                    setOpen(false);
                                    // You can trigger filtering logic here
                                    console.log("Filter by:", category);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm ${
                                    selected === category ? "bg-primary text-gray-700" : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
