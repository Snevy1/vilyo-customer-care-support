"use client";

import React, { useState } from 'react'
import { 
  Bell, 
  Search, 
  HelpCircle,
  ChevronDown,
  Moon,
  Sun,
  Menu
} from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

const Header = () => {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications] = useState(3)
  const { toggleMobile } = useSidebar()

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobile}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search Bar - Center on mobile, left on desktop */}
        <div className="flex-1 max-w-xl mx-4 md:mx-0 ">
          <div className="relative ">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white " />
            <input
              type="search"
              placeholder="Search analytics, reports, users..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-md text-white font-semibold"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          {/* Help - Hidden on mobile */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors hidden md:flex">
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-2 md:pl-4 border-l border-gray-200">
            <div className="h-8 w-8 rounded-full bg-linear-to-br bg-blue-400 flex items-center justify-center text-white font-medium">
              AJ
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-gray-900">Alex Johnson</div>
              <div className="text-xs text-gray-500">Admin</div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 hidden md:block">
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header;