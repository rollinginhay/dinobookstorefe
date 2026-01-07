import type {Metadata} from "next";
import React, {Suspense} from "react";
import StoreOverview from "@/components/custom/StoreOverview";

export const metadata: Metadata = {
    title:
        "DinoBookstore",
    description: "",
};

export default function Ecommerce() {
    return (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
            <Suspense fallback={<div className="col-span-12">Loading...</div>}>
                <StoreOverview />
            </Suspense>
        </div>
    );
}