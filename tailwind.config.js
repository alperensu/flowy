/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                "dynamic-base": "var(--dynamic-bg-base)",
                "dynamic-glow": "var(--dynamic-glow-primary)",
                "dynamic-accent": "var(--dynamic-accent)",
            },
        },
    },
    plugins: [],
};
