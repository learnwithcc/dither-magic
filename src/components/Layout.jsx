import React, { useState, useEffect } from 'react';
import { Settings, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed on mobile
  
  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Left Navigation Panel */}
      <div 
        className={`fixed md:static bg-white shadow-lg transition-all duration-300 ease-in-out h-full z-40 ${
          isCollapsed ? '-translate-x-full md:translate-x-0 w-0 md:w-16' : 'translate-x-0 w-64'
        }`}
      >
        <nav className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <h1 className={`text-xl font-bold transition-opacity duration-200 ${
              isCollapsed ? 'opacity-0 md:w-0' : 'opacity-100'
            }`}>
              Dithering
            </h1>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex absolute -right-4 top-6 bg-white shadow-md rounded-full p-1"
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
          <div className="flex-grow px-4">
            {/* Add nav items here if needed */}
          </div>

          {/* Settings Button */}
          <button className="p-6 hover:bg-gray-100 flex items-center justify-center touch-manipulation">
            <Settings className="h-6 w-6" />
            <span className={`ml-3 transition-opacity duration-200 ${
              isCollapsed ? 'opacity-0 md:w-0' : 'opacity-100'
            }`}>
              Settings
            </span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 ml-0 md:ml-16 overflow-auto">
        <div className="mt-12 md:mt-0">
          {children}
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </div>
  );
};

export default Layout;
