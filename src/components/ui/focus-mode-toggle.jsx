import React from 'react';
import { Focus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Focus mode toggle for ADHD-friendly interface.
 * Allows users to switch between full and simplified views.
 *
 * @param {Object} props
 * @param {boolean} props.enabled - Whether focus mode is active
 * @param {Function} props.onToggle - Callback when toggled
 */
const FocusModeToggle = ({ enabled, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        enabled
          ? "bg-indigo-100 text-indigo-700 focus:ring-indigo-500"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-500"
      )}
      aria-pressed={enabled}
      title={enabled ? "Switch to full mode" : "Switch to focus mode"}
    >
      {enabled ? (
        <>
          <Focus className="w-4 h-4" />
          <span className="text-sm font-medium">Focus Mode</span>
          <span className="ml-1 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Full Mode</span>
        </>
      )}
    </button>
  );
};

/**
 * Focus mode context provider and info panel.
 * Displays information about what's hidden in focus mode.
 */
export const FocusModeInfo = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-2">
        <Focus className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-indigo-700">
          <strong>Focus Mode Active</strong>
          <p className="text-indigo-600 mt-1">
            Showing only essential options. Advanced settings are hidden to reduce distractions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FocusModeToggle;
