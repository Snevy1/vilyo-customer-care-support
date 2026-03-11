"use client";
import React from 'react';
import { 
  UserCircle, 
  Cpu, 
  Wallet, 
  Settings, 
  LayoutDashboard, 
  LogOut,
  ChevronRight,
  BarChart3,
  Users as UsersIcon,
  FileText,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '../context/SidebarContext';

const sidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { name: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { name: 'Users', icon: UsersIcon, href: '/admin/users' },
  { name: 'AI Providers', icon: Cpu, href: '/admin/aiProviders' },
  { name: 'Finance', icon: Wallet, href: '/admin/finance' },
  { name: 'Reports', icon: FileText, href: '/admin/reports' },
  { name: 'Account', icon: UserCircle, href: '/admin/adminUsers/accountProfile' },
  { name: 'Settings', icon: Settings, href: '/admin/siteSettings' },
];

const MobileMenuButton = () => {
  const { toggleMobile } = useSidebar();
  
  return (
    <button
      onClick={toggleMobile}
      className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg md:hidden"
    >
      <Menu className="h-6 w-6 text-gray-700" />
    </button>
  );
};

const Sidebar = () => {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, isMobile, isMobileOpen, closeMobile, toggleMobile } = useSidebar();

  // Mobile overlay
  if (isMobile && !isMobileOpen) {
    return <MobileMenuButton />;
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${isMobile ? 'w-64' : isCollapsed ? 'w-20' : 'w-64'}
        ${isMobile && !isMobileOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <div className="flex h-full flex-col px-3 py-4 md:px-4 md:py-6">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between mb-6 md:mb-8 px-1">
            {!isCollapsed && !isMobile ? (
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400 text-white font-bold text-lg">
                  A
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-900">Vilyo Admin</span>
                  <span className="block text-xs text-gray-500">Enterprise</span>
                </div>
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400 text-white font-bold text-lg mx-auto">
                A
              </div>
            )}
            
            {/* Toggle Button - Hidden on mobile */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 hidden md:flex"
              >
                {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
            )}
            
            {/* Close button for mobile */}
            {isMobile && (
              <button
                onClick={closeMobile}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobile}
                  className={`
                    flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-linear-to-r from-blue-50 to-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${isCollapsed && !isMobile ? 'justify-center' : ''}
                  `}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {(!isCollapsed || isMobile) && (
                    <>
                      <span className={`ml-3 ${isCollapsed && !isMobile ? 'hidden' : 'block'}`}>
                        {item.name}
                      </span>
                      {isActive && !isCollapsed && (
                        <ChevronRight className="ml-auto h-4 w-4 text-blue-600" />
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-gray-100 pt-4">
            {(!isCollapsed || isMobile) && (
              <div className="px-3 py-3 bg-linear-to-r from-gray-50 to-gray-100 rounded-lg mb-4">
                <div className="text-xs font-medium text-gray-600 mb-1">Storage Usage</div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                  <div className="bg-blue-600 h-1.5 rounded-full w-3/4"></div>
                </div>
                <div className="text-xs text-gray-500">74% of 100GB</div>
              </div>
            )}
            
            <button className={`
              flex items-center rounded-lg px-3 py-3 text-sm font-medium 
              text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600
              ${isCollapsed && !isMobile ? 'justify-center' : ''}
            `}>
              <LogOut className="h-5 w-5" />
              {(!isCollapsed || isMobile) && (
                <span className={`ml-3 ${isCollapsed && !isMobile ? 'hidden' : 'block'}`}>
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Collapsed overlay for main content */}
      {!isMobile && !isCollapsed && (
        <div className="hidden md:block w-64 shrink-0" />
      )}
      {!isMobile && isCollapsed && (
        <div className="hidden md:block w-20 shrink-0" />
      )}
    </>
  );
};

export default Sidebar;