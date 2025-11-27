import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {Metadata} from "next";
import React from "react";
import ProductListTable from "@/components/custom/ProductListTable";

export const metadata: Metadata = {
    title: "Dinobooks",
    description:
        "",
};

export default function ProductPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Books"/>
            <ProductListTable/>
        </div>
    );
}
