import flowbite from "flowbite/plugin";

module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js",
  ],

  safelist: [
    "sidebar-fahasa",
    "menu-item-active",
    "menu-item-inactive",
    "menu-item-icon-inactive",
    "menu-item-icon-active",
  ],

  theme: {
    extend: {},
  },

  plugins: [flowbite],
};
