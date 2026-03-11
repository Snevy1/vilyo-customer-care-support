import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/sidebar";
import Header from "./components/Header";
import { SidebarProvider } from "./context/SidebarContext";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "A professional Admin panel built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#FFFFFF]">
        <SidebarProvider>
          <div className="flex min-h-screen bg-[#FFFFFF]">
            <Sidebar />
            {/* Main Content Area */}
            <div className="flex-1  flex flex-col md:ml-5 transition-all duration-300 bg-[#FFFFFF]">
              <Header />
              <main className="flex-1">
                <div className="p-4 md:p-6">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}