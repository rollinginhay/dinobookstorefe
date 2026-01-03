import type {Metadata} from "next";
import React from "react";
import {ProtectedRoute} from "@/components/custom/ProtectedRoute";
import StoreOverview from "@/components/custom/StoreOverview";

export const metadata: Metadata = {
    title:
        "DinoBookstore",
    description: "",
};

export default function Ecommerce() {
    return (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
            <ProtectedRoute>
                <StoreOverview></StoreOverview>
            </ProtectedRoute>
        </div>
    );
}