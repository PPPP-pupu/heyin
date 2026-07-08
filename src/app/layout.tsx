import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heyin - 和音",
  description: "一起唱，留下每一个声音。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
