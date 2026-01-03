import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {Metadata} from "next";
import React from "react";
import ProductDetailTable from "@/components/custom/ProductDetailTable";

export const metadata: Metadata = {
    title: "Dinobooks",
    description:
        "",
};

export default function ReceiptPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Thông tin hóa đơn"/>
            <ProductDetailTable/>
        </div>
    );
}
