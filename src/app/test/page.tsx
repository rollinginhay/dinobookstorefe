"use client";
import React from "react";
import {useBookSingle} from "@/hooks/api-calls/useBookSingle";
import {deserializeBook, serializeBook} from "@/lib/serializers";

export default function FormLayout() {
// Run this where kitsu-core is installed
    const bookFetch = useBookSingle(1200);
    if (bookFetch.isLoading) return <p className="p-6">Loading...</p>;
    const book = bookFetch.data.data;
    const formData = deserializeBook(book);

    const reqBody = serializeBook("book", formData);

    console.log("formData", formData);
    console.log("reqBody", reqBody);
    return (
        <div>
        </div>
    );
}
