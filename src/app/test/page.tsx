"use client";
import React from "react";

function loginWithGoogle() {
    const popup = window.open(
        `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorize/google`,
        "oauth2Login",
        "width=600,height=700"
    );

    window.addEventListener("message", (event) => {
        if (event.data.token) {
            console.log("JWT received:", event.data.token);
            localStorage.setItem("auth_token", event.data.token);
        }
    });
}


export default function FormLayout() {
// Run this where kitsu-core is installed

    return (
        <div>
        </div>
    );
}
