import {Inter} from "next/font/google";
import "./globals.css";
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import {SidebarProvider} from "@/context/SidebarContext";
import {ThemeProvider} from "@/context/ThemeContext";
import {AppProviders} from "@/lib/providers";
import {Toaster} from "sonner";
import {AuthProvider} from "@/context/auth-context";
import {ProtectedRoute} from "@/components/custom/ProtectedRoute";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={`${inter.className} dark:bg-gray-900`}>
        <ThemeProvider>
            <SidebarProvider>
                <AuthProvider>
                    <AppProviders>
                        <ProtectedRoute>
                            {children}
                            <Toaster richColors={true} position="top-right"/>
                        </ProtectedRoute>
                    </AppProviders>
                </AuthProvider>
            </SidebarProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}
