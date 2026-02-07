"use client"

import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { 
  BookOpen, Bot, Contact, Layers, LayoutDashboard, 
  MessageCircle, MessageSquare, Settings, Zap, 
  Users, Phone, FileText, BarChart, Bell,
  CreditCard, HelpCircle, Globe, Shield,
  Workflow, Database, Mail, Calendar,
  PieChart, Target, Users2, Smartphone, ChevronLeft, X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  product?: 'webchat' | 'whatsapp' | 'crm' | 'general';
  badge?: string;
}

interface ProductSection {
  id: 'webchat' | 'whatsapp' | 'crm';
  title: string;
  icon: React.ComponentType<any>;
  description?: string;
  items: SidebarItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
}

const PRODUCT_SECTIONS: ProductSection[] = [
  {
    id: 'webchat',
    title: 'WebChat',
    icon: MessageSquare,
    description: 'Website live chat',
    items: [
      { label: "Dashboard", href: "/dashboard/webchat", icon: LayoutDashboard, product: 'webchat' },
      { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare, product: 'webchat' },
      { label: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen, product: 'webchat' },
      { label: "Chat Sections", href: "/dashboard/sections", icon: Layers, product: 'webchat' },
      { label: "Chatbot AI", href: "/dashboard/chatbot", icon: Bot, product: 'webchat' },
      { label: "Widget Settings", href: "/dashboard/widget", icon: Globe, product: 'webchat' },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart, product: 'webchat' },
      { label: "Automation", href: "/dashboard/automation", icon: Workflow, product: 'webchat' },
      { label: "Team", href: "/dashboard/team", icon: Users, product: 'webchat' },
    ]
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    icon: MessageCircle,
    description: 'Business messaging',
    items: [
      { label: "Dashboard", href: "/dashboard/whatsapp", icon: LayoutDashboard, product: 'whatsapp' },
      { label: "Conversations", href: "/dashboard/whatsapp", icon: MessageSquare, product: 'whatsapp' },
      { label: "Contacts", href: "/dashboard/whatsapp", icon: Contact, product: 'whatsapp' },
      { label: "Templates", href: "/dashboard/whatsapp", icon: FileText, product: 'whatsapp' },
      { label: "Campaigns", href: "/dashboard/whatsapp", icon: Target, product: 'whatsapp' },
      { label: "Knowledge Base", href: "/dashboard/whatsapp", icon: BookOpen, product: 'whatsapp' },
      { label: "Analytics", href: "/dashboard/whatsapp", icon: PieChart, product: 'whatsapp' },
      { label: "Numbers", href: "/dashboard/whatsapp", icon: Smartphone, product: 'whatsapp' },
      { label: "Automation", href: "/dashboard/whatsapp", icon: Workflow, product: 'whatsapp', badge: "New" },
    ]
  },
  {
    id: 'crm',
    title: 'CRM',
    icon: Users2,
    description: 'Customer relationships',
    items: [
      { label: "Dashboard", href: "/dashboard/crm", icon: LayoutDashboard, product: 'crm' },  // We will create specific pages for these subitems later
      { label: "Contacts", href: "/dashboard/crm", icon: Contact, product: 'crm' },
      { label: "Leads", href: "/dashboard/crm", icon: Target, product: 'crm' },
      { label: "Deals", href: "/dashboard/crm", icon: CreditCard, product: 'crm' },
      { label: "Activities", href: "/dashboard/crm", icon: Calendar, product: 'crm' },
      { label: "Email Campaigns", href: "/dashboard/crm", icon: Mail, product: 'crm' },
      { label: "Analytics", href: "/dashboard/crm", icon: BarChart, product: 'crm' },
      { label: "Reports", href: "/dashboard/crm", icon: FileText, product: 'crm' },
      { label: "Team", href: "/dashboard/crm", icon: Users, product: 'crm' },
      { label: "Import/Export", href: "/dashboard/crm", icon: Database, product: 'crm' },
    ]
  }
];

// General items (not product-specific)
const GENERAL_ITEMS: SidebarItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, product: 'general' },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard, product: 'general' },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, product: 'general' },
  { label: "Help & Support", href: "/dashboard/support", icon: HelpCircle, product: 'general' },
];

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { email } = useUser();
  const [metadata, setMetadata] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    webchat: true,
    whatsapp: false,
    crm: false,
    general: true
  });

  // Auto-expand the section based on current path
  useEffect(() => {
    const newExpanded = { ...expandedSections };
    
    // Find which product the current path belongs to
    if (pathname.includes('/dashboard/webchat')) {
      newExpanded.webchat = true;
    } else if (pathname.includes('/dashboard/whatsapp')) {
      newExpanded.whatsapp = true;
    } else if (pathname.includes('/dashboard/crm')) {
      newExpanded.crm = true;
    } else if (pathname === '/dashboard') {
      // Keep general expanded for dashboard
      newExpanded.general = true;
    }
    
    setExpandedSections(newExpanded);
  }, [pathname]);

  useEffect(() => {
    const fetchMetadata = async () => {
      const response = await fetch("/api/metadata/fetch");
      const res = await response.json();
      setMetadata(res.data);
      setIsLoading(false);
    };
    fetchMetadata();
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getProductFromPath = (path: string) => {
    if (path.includes('/dashboard/webchat')) return 'webchat';
    if (path.includes('/dashboard/whatsapp')) return 'whatsapp';
    if (path.includes('/dashboard/crm')) return 'crm';
    return 'general';
  };

  const currentProduct = getProductFromPath(pathname);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  return (
    <aside className={cn(
      'border-r mt-10  border-white/5 bg-[#050509] flex-col  h-screen fixed left-0 top-0 z-40 transition-all duration-300',
      // Desktop behavior
      'hidden md:flex',
      isCollapsed ? 'w-20' : 'w-100',
      // Mobile behavior
      'md:translate-x-0',
      isMobileOpen ? 'flex translate-x-0' : '-translate-x-full',
      isMobileOpen && 'w-70'
    )}>
      {/* Header with collapse button */}
      <div className='h-16 flex items-center justify-between px-6 border-b border-white/5'>
        <Link href={"/"} className={cn(
          'flex items-center gap-2 transition-opacity',
          isCollapsed && 'md:opacity-0 md:pointer-events-none'
        )}>
          <div className='w-5 h-5 bg-white rounded-sm flex items-center justify-center'>
            <div className='w-2.5 h-2.5 bg-black rounded-[1px]'></div>
          </div>
          <span className='text-sm font-medium tracking-tight text-white/90'>
            Vilyo Support
          </span>
        </Link>
        
        {/* Desktop collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'hidden md:block p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white transition-all',
            isCollapsed && 'mx-auto'
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn(
            'w-4 h-4 transition-transform',
            isCollapsed && 'rotate-180'
          )} />
        </button>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className='flex-1 p-4 space-y-6 overflow-y-auto'>
        {/* Product Sections */}
        {PRODUCT_SECTIONS.map((section) => {
          const isExpanded = expandedSections[section.id];
          const isActiveSection = currentProduct === section.id;
          
          return (
            <div key={section.id} className="space-y-2">
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActiveSection 
                    ? "bg-white/10 text-white" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
                title={isCollapsed ? section.title : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <section.icon className='w-4 h-4 shrink-0' />
                  {(!isCollapsed || isMobileOpen) && (
                    <>
                      <span className="truncate">{section.title}</span>
                      {section.description && (
                        <span className="text-xs text-zinc-500 font-normal truncate">
                          {section.description}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <svg
                    className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              
              {isExpanded && (!isCollapsed || isMobileOpen) && (
                <div className="ml-4 space-y-1 border-l border-white/5 pl-3">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    
                    return (
                      <Link
                        key={item.href + '-' + item.label}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group",
                          isActive 
                            ? "bg-blue-500/20 text-blue-400 border-l-2 border-blue-500 -ml-0.5" 
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <item.icon className='w-3.5 h-3.5 shrink-0' />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Collapsed state - show icon-only items on hover */}
              {isCollapsed && !isMobileOpen && isActiveSection && (
                <div className="space-y-1">
                  {section.items.slice(0, 3).map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    
                    return (
                      <Link
                        key={item.href + '-' + item.label}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center p-2 rounded-lg transition-colors",
                          isActive 
                            ? "bg-blue-500/20 text-blue-400" 
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )}
                        title={item.label}
                      >
                        <item.icon className='w-4 h-4' />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Divider */}
        <div className="border-t border-white/5"></div>

        {/* General Section */}
        <div className="space-y-2">
          {(!isCollapsed || isMobileOpen) && (
            <div className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              General
            </div>
          )}
          
          <div className="space-y-1">
            {GENERAL_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-white/10 text-white" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5",
                    isCollapsed && !isMobileOpen && "justify-center"
                  )}
                  title={(isCollapsed && !isMobileOpen) ? item.label : undefined}
                >
                  <item.icon className='w-4 h-4 shrink-0' />
                  {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Stats (Optional) - hide when collapsed */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-zinc-400 mb-3 font-medium">Active Products</div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-zinc-300">WebChat</span>
                </div>
                <span className="text-zinc-400 text-xs">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-zinc-300">WhatsApp</span>
                </div>
                <span className="text-zinc-400 text-xs">Trial</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-zinc-300">CRM</span>
                </div>
                <span className="text-zinc-400 text-xs">Inactive</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Profile / Bottom Area */}
      <div className='p-4 border-t border-white/5'>
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group',
          isCollapsed && !isMobileOpen && 'justify-center'
        )}>
          <div className='w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 shrink-0'>
            <span className='text-xs text-zinc-400 group-hover:text-white'>
              {metadata?.business_name?.slice(0,2).toUpperCase() || ""} 
            </span>
          </div>

          {(!isCollapsed || isMobileOpen) && (
            <div className='flex flex-col overflow-hidden min-w-0'>
              <span className='text-sm font-medium text-zinc-300 truncate group-hover:text-white'>
                {isLoading ? "Loading..." : `${metadata?.business_name}'s Workspace`}
              </span>
              <span className='text-xs text-zinc-500 truncate'>{email}</span>
            </div>
          )}
        </div>

        {/* Subscription Status - hide when collapsed */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="mt-3 px-3 py-2.5 bg-zinc-900/50 rounded-lg text-xs mb-10">
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span>Plan</span>
              <span className="text-green-400">Active</span>
            </div>
            <div className="text-zinc-300 font-medium">Business Pro</div>
            <div className="text-zinc-500 text-[10px] mt-1">Renews on Jan 30, 2024</div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;