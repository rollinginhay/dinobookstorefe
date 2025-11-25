import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AddProductForm from "@/components/ecommerce/AddProductForm";
import {Metadata} from "next";
import BookForm from "@/components/custom/BookForm";

export const metadata: Metadata = {
    title:
        "Next.js E-commerce Add Product | TailAdmin - Next.js Dashboard Template",
    description:
        "This is Next.js E-commerce  Add Product  TailAdmin Dashboard Template",
};

export default function CreateBookPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Add Book"/>
            <BookForm/>
        </div>
    );
}
