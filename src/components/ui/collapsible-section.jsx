import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Collapsible section component for progressive disclosure.
 * Reduces visual clutter by hiding non-essential options until needed.
 * Perfect for ADHD-friendly interfaces.
 *
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.description - Optional description text
 * @param {React.ReactNode} props.icon - Optional icon component
 * @param {React.ReactNode} props.children - Section content
 * @param {boolean} props.defaultOpen - Whether section starts expanded
 * @param {string} props.badge - Optional badge text (e.g., count)
 * @param {string} props.className - Additional CSS classes
 */
const CollapsibleSection = ({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
  className
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden transition-all duration-200",
      isOpen ? "border-gray-300 shadow-sm" : "border-gray-200",
      className
    )}>
      {/* Header - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 text-left",
          "hover:bg-gray-50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isOpen ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
            )}>
              <Icon className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h4 className={cn(
                "font-semibold",
                isOpen ? "text-gray-900" : "text-gray-700"
              )}>
                {title}
              </h4>

              {badge && (
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </div>

            {description && (
              <p className="text-sm text-gray-500 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          "transition-colors",
          isOpen ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
        )}>
          {isOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Content - collapsible */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 pt-0 border-t border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
