import type { Config } from "tailwindcss";
import flowbite from "flowbite/plugin";

export default {
    content: [
        "./app/**/*.{ts,tsx,js,jsx,mdx}",
        "./pages/**/*.{ts,tsx,js,jsx,mdx}",
        "./components/**/*.{ts,tsx,js,jsx,mdx}",
        "./node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}",
        "./node_modules/flowbite/**/*.js",
    ],
    theme: {
        extend: {},
    },
    plugins: [flowbite],
} satisfies Config;
