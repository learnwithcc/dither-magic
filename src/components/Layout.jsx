import React, { useState } from 'react';
import { Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Navigation Panel */}
      <div 
        className={`bg-white shadow-lg transition-all duration-300 ease-in-out relative ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <nav className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <h1 className={`text-xl font-bold transition-opacity duration-200 ${
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            }`}>
              Dithering
            </h1>
            <Button
              variant="ghost"
              size="sm"
              className="absolute -right-4 top-6 bg-white shadow-md rounded-full p-1"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Nav items */}
          <div className="flex-grow">
            {/* Add nav items here if needed */}
          </div>

          {/* Settings Button */}
          <button className="p-4 hover:bg-gray-100 flex items-center justify-center">
            <Settings className="h-6 w-6" />
            <span className={`ml-2 transition-opacity duration-200 ${
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            }`}>
              Settings
            </span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;
