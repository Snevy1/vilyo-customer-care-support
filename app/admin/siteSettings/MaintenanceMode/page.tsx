
"use client"
import React, { useState } from 'react';
import CloseWebsite from './CloseWebsite';
import { HammerIcon } from 'lucide-react';

export default function index() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 justify-center h-[80vh] bg-gray-100">
      <HammerIcon
        size={200}
        fill={!isMaintenanceMode ? '#ef4444' : '#000080'}
        className={!isMaintenanceMode ? 'text-[#ef4444]' : 'text-[#000080]'}
      />
      <CloseWebsite
        isMaintenanceMode={isMaintenanceMode}
        setIsMaintenanceMode={setIsMaintenanceMode}
      />
    </div>
  );
}
