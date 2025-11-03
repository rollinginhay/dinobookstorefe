import type { Metadata } from "next";
import "./globals.css";
import RootHeader from "./component/header";
import RootFooter from "./component/footer";


export const metadata: Metadata = {
  title: "DinoStoreBook",
  description: "Chuỗi Phân Phối Sách Chuẩn Hiệu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <RootHeader />
        {children}
        <RootFooter />
      </body>
    </html>
  );
}
