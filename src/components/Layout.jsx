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
        className={`fixed md:relative h-screen bg-white shadow-lg transition-all duration-300 ease-in-out ${
          isCollapsed 
            ? '-translate-x-full md:translate-x-0 md:w-16' 
            : 'translate-x-0 w-64'
        }`}
      >
        <nav className="flex flex-col h-full">
          <div className="p-4">
            <h1 className={`text-xl font-bold ${isCollapsed ? 'md:hidden' : ''}`}>
              Dithering
            </h1>
          </div>
          
          {/* Toggle button */}
          <button
            className="absolute -right-3 top-6 bg-white shadow-md rounded-full p-1 hidden md:block"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          <div className="flex-grow px-4">
            {/* Nav items here */}
          </div>

          <button className="p-4 hover:bg-gray-100 flex items-center">
            <Settings className="h-6 w-6" />
            <span className={`ml-2 ${isCollapsed ? 'md:hidden' : ''}`}>
              Settings
            </span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 p-4 md:p-8 transition-all ${
        isCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        {children}
      </div>

      {/* Mobile overlay */}
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
