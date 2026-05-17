import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Locally",
  description: "Hyperlocal clothing store directory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <div className="mx-auto max-w-[480px] min-h-screen bg-surface">
          {children}
        </div>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
