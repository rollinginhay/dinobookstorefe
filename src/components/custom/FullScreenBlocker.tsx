"use client";

import {createPortal} from "react-dom";

export function FullscreenBlocker() {
    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            aria-hidden
            className="
        fixed inset-0
        bg-white dark:bg-black
        z-[2147483647]
      "
        />,
        document.body
    );
}
