import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootStoreProvider } from "@/store/RootStoreProvider";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "CRM Расторжения 44-ФЗ",
  description: "Управление расторжениями по 44-ФЗ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <RootStoreProvider>{children}</RootStoreProvider>
      </body>
    </html>
  );
}