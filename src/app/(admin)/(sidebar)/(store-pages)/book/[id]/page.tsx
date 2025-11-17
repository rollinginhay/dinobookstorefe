import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {Metadata} from "next";
import React from "react";
import ProductDetailTable from "@/components/custom/ProductDetailTable";
import ProductInfoCard from "@/components/custom/ProductInfoCard";

export const metadata: Metadata = {
    title: "Dinobooks",
    description:
        "",
};

export default function ProductPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Book Details"/>
            <ProductDetailTable/>
        </div>
    );
}
