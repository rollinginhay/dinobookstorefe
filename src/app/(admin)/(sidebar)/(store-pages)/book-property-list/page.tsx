import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {Metadata} from "next";
import React from "react";
import ProductPropertyListTable from "@/components/custom/ProductPropertyListTable";

export const metadata: Metadata = {
    title: "Dinobooks",
    description:
        "",
};

export default function ProductPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Book properties"/>
            <ProductPropertyListTable/>
        </div>
    );
}
