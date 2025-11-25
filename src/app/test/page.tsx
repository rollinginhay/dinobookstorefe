import {Metadata} from "next";
import React from "react";
import {serializeBook} from "@/lib/requestSerializer";

export const metadata: Metadata = {
    title: "Next.js Form Layout | TailAdmin - Next.js Dashboard Template",
    description:
        "This is Next.js Form Layout page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function FormLayout() {
// Run this where kitsu-core is installed

    const formData = {
        attributes: {
            id: null,
            title: "Sample Book",
            edition: "1st",
            language: "EN",
            published: "2024-01-01",
            imageUrl: "",
            blurb: "Testing included"
        },

        relationships: {
            genres: [
                {
                    id: "1",
                    type: "genre",
                    name: "Fantasy",
                    createdAt: "2020-01-01"
                },
                {
                    id: "2",
                    type: "genre",
                    name: "Horror",
                    createdAt: "2020-02-02"
                }
            ],

            creators: [
                {
                    id: "10",
                    type: "creator",
                    fullName: "John Doe",
                    born: "1980-01-01"
                }
            ],

            publisher: {
                id: "22",
                type: "publisher",
                name: "CoolPub",
                founded: 1985
            },

            series: null
        }
    };

    const json = serializeBook("book", formData);


    console.log("\nserialise('book', resource) -> OUTPUT:\n", JSON.stringify(json, null, 2));


    return (<h1>CHECK CONSOLE</h1>
    );
}
