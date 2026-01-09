import React from 'react';
import { Sparkles, Gamepad2, Newspaper, Leaf, Grid3X3, Wand2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

/**
 * Algorithm presets for quick ADHD-friendly selection.
 * Reduces decision fatigue by offering curated combinations.
 *
 * @param {Object} props
 * @param {Function} props.onSelectPreset - Callback when preset is selected
 * @param {Function} props.onSelectPalette - Callback to set palette
 * @param {string} props.activePreset - Currently active preset ID
 */
const AlgorithmPresets = ({ onSelectPreset, onSelectPalette, activePreset = null }) => {
  const presets = [
    {
      id: 'classic',
      name: 'Classic',
      description: 'Clean & simple',
      icon: Sparkles,
      algorithms: ['floyd-steinberg'],
      palette: 'bw',
      color: 'blue',
      recommended: true
    },
    {
      id: 'retro-gaming',
      name: 'Retro Gaming',
      description: 'GameBoy vibes',
      icon: Gamepad2,
      algorithms: ['atkinson'],
      palette: 'gameboy',
      color: 'green'
    },
    {
      id: 'newspaper',
      name: 'Newspaper',
      description: 'Print halftone',
      icon: Newspaper,
      algorithms: ['halftone'],
      palette: 'bw',
      color: 'gray'
    },
    {
      id: 'natural',
      name: 'Natural',
      description: 'Smooth & organic',
      icon: Leaf,
      algorithms: ['blue-noise', 'sierra-lite'],
      palette: 'bw',
      color: 'emerald'
    },
    {
      id: 'compare-all',
      name: 'Compare All',
      description: 'Try everything',
      icon: Grid3X3,
      algorithms: [
        'floyd-steinberg', 'ordered', 'atkinson', 'bayer',
        'stucki', 'jarvis', 'burkes', 'sierra',
        'sierra-two-row', 'sierra-lite', 'halftone', 'blue-noise'
      ],
      palette: 'bw',
      color: 'purple'
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Pick your own',
      icon: Wand2,
      algorithms: null, // null = don't change algorithms
      palette: null,
      color: 'orange'
    }
  ];

  const colorVariants = {
    blue: {
      active: 'bg-blue-500 text-white border-blue-500 shadow-blue-200',
      inactive: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
    },
    green: {
      active: 'bg-green-500 text-white border-green-500 shadow-green-200',
      inactive: 'border-green-200 hover:border-green-400 hover:bg-green-50'
    },
    gray: {
      active: 'bg-gray-700 text-white border-gray-700 shadow-gray-200',
      inactive: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
    },
    emerald: {
      active: 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-200',
      inactive: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'
    },
    purple: {
      active: 'bg-purple-500 text-white border-purple-500 shadow-purple-200',
      inactive: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
    },
    orange: {
      active: 'bg-orange-500 text-white border-orange-500 shadow-orange-200',
      inactive: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50'
    }
  };

  const handlePresetClick = (preset) => {
    if (preset.algorithms) {
      onSelectPreset(preset.id, preset.algorithms);
    } else {
      onSelectPreset('custom', null);
    }

    if (preset.palette && onSelectPalette) {
      onSelectPalette(preset.palette);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Quick Start</h3>
        <span className="text-xs text-gray-400">Pick a style to begin</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isActive = activePreset === preset.id;
          const colors = colorVariants[preset.color];

          return (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                isActive ? `${colors.active} shadow-lg` : colors.inactive
              )}
            >
              {preset.recommended && !isActive && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  Best
                </span>
              )}

              <Icon className={cn(
                "w-8 h-8 mb-2",
                isActive ? "text-white" : `text-${preset.color}-500`
              )} />

              <span className={cn(
                "font-semibold text-sm",
                isActive ? "text-white" : "text-gray-800"
              )}>
                {preset.name}
              </span>

              <span className={cn(
                "text-xs mt-1",
                isActive ? "text-white/80" : "text-gray-500"
              )}>
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>

      {activePreset && activePreset !== 'custom' && (
        <p className="text-xs text-center text-gray-500 mt-2">
          {presets.find(p => p.id === activePreset)?.algorithms?.length || 0} algorithm(s) selected
        </p>
      )}
    </div>
  );
};

export default AlgorithmPresets;
