"use client"


import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";

export default function DashboardLayout({
    children,
    metadataCookie
}: { 
    children: React.ReactNode;
    metadataCookie?: string;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="bg-[#050509] min-h-screen font-sans antialiased text-zinc-100 selection:bg-zinc-800 flex">
           {metadataCookie ? (
              <>
               {/* Mobile Menu Button */}
               <button
                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                 className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
               >
                 <Menu className="w-5 h-5" />
               </button>

               {/* Mobile Overlay */}
               {isSidebarOpen && (
                 <div 
                   className="fixed inset-0 bg-black/50 z-40 md:hidden"
                   onClick={() => setIsSidebarOpen(false)}
                 />
               )}

               <Sidebar
                 isCollapsed={isCollapsed}
                 setIsCollapsed={setIsCollapsed}
                 isMobileOpen={isSidebarOpen}
                 setIsMobileOpen={setIsSidebarOpen}
               />
              
              <div className={`flex-1 flex flex-col relative min-h-screen transition-all duration-300 ${
                isCollapsed ? 'md:ml-20' : 'md:ml-70'
              }`}>
                  <main className="flex-1">
                    {children}
                  </main>
              </div>
              </>
           ): children} 
        </div>
    )
}