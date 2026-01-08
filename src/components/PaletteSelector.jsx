import React from 'react';
import { Check } from 'lucide-react';

/**
 * Displays a single palette as a row of color swatches.
 *
 * @param {Object} props
 * @param {Array<number[]>} props.colors - Array of RGB color arrays
 * @param {string} [props.size='md'] - Size variant: 'sm', 'md', or 'lg'
 */
const PalettePreview = ({ colors, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex gap-0.5">
      {colors.slice(0, 8).map((color, i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} rounded-sm border border-gray-300`}
          style={{ backgroundColor: `rgb(${color.join(',')})` }}
        />
      ))}
      {colors.length > 8 && (
        <span className="text-xs text-gray-400 ml-1">+{colors.length - 8}</span>
      )}
    </div>
  );
};

/**
 * Parses a comma-separated string of hex colors into RGB arrays.
 *
 * @param {string} hexString - Comma-separated hex colors (e.g., "#FF0000, #00FF00")
 * @returns {Array<number[]>} Array of RGB arrays
 */
export const parseHexColors = (hexString) => {
  if (!hexString || !hexString.trim()) return [];

  const hexColors = hexString.split(',').map(c => c.trim());
  const rgbColors = [];

  for (const hex of hexColors) {
    // Remove # if present and handle shorthand hex
    let cleanHex = hex.replace('#', '');

    // Convert shorthand hex (e.g., "F00" -> "FF0000")
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }

    // Validate hex format
    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) continue;

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    rgbColors.push([r, g, b]);
  }

  return rgbColors;
};

/**
 * Palette selector component with preset and custom palette support.
 *
 * @param {Object} props
 * @param {Array} props.palettes - Array of palette objects with id, name, category, colors
 * @param {string} props.selectedPalette - Currently selected palette ID
 * @param {Function} props.onSelect - Callback when a palette is selected
 * @param {string} props.customPalette - Custom palette input value
 * @param {Function} props.onCustomPaletteChange - Callback when custom palette input changes
 */
const PaletteSelector = ({
  palettes,
  selectedPalette,
  onSelect,
  customPalette,
  onCustomPaletteChange
}) => {
  const categories = {
    classic: 'Classic',
    retro: 'Retro Gaming',
    artistic: 'Artistic',
    modern: 'Modern'
  };

  const groupedPalettes = palettes.reduce((acc, p) => {
    const cat = p.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  // Order categories
  const categoryOrder = ['classic', 'retro', 'artistic', 'modern', 'other'];
  const orderedCategories = categoryOrder.filter(cat => groupedPalettes[cat]);

  const customColors = parseHexColors(customPalette);
  const isCustomValid = customColors.length >= 2;

  return (
    <div className="space-y-4">
      {orderedCategories.map((category) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            {categories[category] || category}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {groupedPalettes[category].map((palette) => (
              <button
                key={palette.id}
                onClick={() => onSelect(palette.id)}
                className={`
                  flex items-center gap-2 p-2 rounded-lg border-2 transition-colors text-left
                  ${selectedPalette === palette.id && !customPalette
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <PalettePreview colors={palette.colors} size="sm" />
                <span className="text-sm truncate flex-1">{palette.name}</span>
                {selectedPalette === palette.id && !customPalette && (
                  <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Custom Palette Input */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Custom Palette</h4>
        <input
          type="text"
          placeholder="#FF0000, #00FF00, #0000FF"
          className={`w-full p-2 border rounded-lg text-sm ${
            customPalette && !isCustomValid
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-200 focus:border-blue-500'
          } focus:outline-none`}
          value={customPalette}
          onChange={(e) => onCustomPaletteChange(e.target.value)}
        />
        {customPalette && (
          <div className="mt-2">
            {isCustomValid ? (
              <div className="flex items-center gap-2">
                <PalettePreview colors={customColors} size="sm" />
                <span className="text-xs text-green-600">
                  {customColors.length} colors
                </span>
              </div>
            ) : (
              <p className="text-xs text-red-500">
                Enter at least 2 valid hex colors (e.g., #FF0000, #00FF00)
              </p>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Enter comma-separated hex colors. Overrides preset selection.
        </p>
      </div>
    </div>
  );
};

export default PaletteSelector;
