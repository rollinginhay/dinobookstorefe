import {Outfit} from "next/font/google";
import "./globals.css";
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import {SidebarProvider} from "@/context/SidebarContext";
import {ThemeProvider} from "@/context/ThemeContext";
import {AppProviders} from "@/lib/providers";
import {Toaster} from "sonner";

const outfit = Outfit({
    subsets: ["latin"],
});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
            <SidebarProvider>
                <AppProviders>
                    {children}
                    <Toaster richColors={true} position="top-right"/>
                </AppProviders>
            </SidebarProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}
