import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "A simple Admin panel built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
