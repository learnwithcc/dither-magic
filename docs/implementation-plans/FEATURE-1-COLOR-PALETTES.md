# Feature 1: Custom Color Palette System

## Implementation Plan

**Priority:** High
**Estimated Complexity:** Medium
**Files to Modify:** 6
**New Files:** 3

---

## Overview

Transform Dither-Magic from black & white only to support full color dithering with preset retro gaming palettes (Game Boy, NES, SNES, C64, CGA) and custom user-defined palettes.

---

## Technical Architecture

### Current State
- All algorithms in `dithering.py` convert to grayscale (`image.convert('L')`)
- Output is binary black/white (threshold at 127)
- No color preservation or palette mapping

### Target State
- Support color-to-palette dithering with configurable target colors
- Preserve the original color dithering algorithms structure
- Add palette selection UI in frontend
- Store custom palettes in localStorage

---

## Implementation Steps

### Phase 1: Backend - Color Dithering Core

#### Step 1.1: Create Palette Definitions Module

**New File:** `palettes.py`

```python
"""
Predefined color palettes for retro-style dithering.

Each palette is a list of RGB tuples representing the available colors
for the dithering algorithm to map pixels to.
"""

PALETTES = {
    'bw': [
        (0, 0, 0),       # Black
        (255, 255, 255)  # White
    ],

    'gameboy': [
        (15, 56, 15),    # Darkest green
        (48, 98, 48),    # Dark green
        (139, 172, 15),  # Light green
        (155, 188, 15)   # Lightest green
    ],

    'gameboy-pocket': [
        (0, 0, 0),       # Black
        (85, 85, 85),    # Dark gray
        (170, 170, 170), # Light gray
        (255, 255, 255)  # White
    ],

    'nes': [
        # NES 54-color palette (commonly used subset)
        (0, 0, 0), (252, 252, 252), (188, 188, 188), (124, 124, 124),
        (164, 0, 0), (228, 0, 88), (216, 40, 120), (252, 116, 180),
        (0, 120, 248), (104, 68, 252), (248, 120, 88), (248, 56, 0),
        (0, 168, 0), (0, 168, 68), (184, 248, 24), (172, 124, 0),
        (248, 184, 0), (248, 216, 120), (0, 0, 168), (0, 88, 248),
        (88, 216, 84), (152, 120, 248), (248, 88, 152), (60, 188, 252)
    ],

    'c64': [
        (0, 0, 0),       # Black
        (255, 255, 255), # White
        (136, 0, 0),     # Red
        (170, 255, 238), # Cyan
        (204, 68, 204),  # Purple
        (0, 204, 85),    # Green
        (0, 0, 170),     # Blue
        (238, 238, 119), # Yellow
        (221, 136, 85),  # Orange
        (102, 68, 0),    # Brown
        (255, 119, 119), # Light Red
        (51, 51, 51),    # Dark Grey
        (119, 119, 119), # Grey
        (170, 255, 102), # Light Green
        (0, 136, 255),   # Light Blue
        (187, 187, 187)  # Light Grey
    ],

    'cga-mode4-p1': [
        (0, 0, 0),       # Black
        (0, 255, 255),   # Cyan
        (255, 0, 255),   # Magenta
        (255, 255, 255)  # White
    ],

    'cga-mode4-p0': [
        (0, 0, 0),       # Black
        (0, 255, 0),     # Green
        (255, 0, 0),     # Red
        (255, 255, 0)    # Yellow/Brown
    ],

    'sepia': [
        (44, 33, 24),    # Dark sepia
        (92, 64, 51),    # Medium dark
        (155, 118, 83),  # Medium
        (199, 172, 132), # Light
        (242, 227, 198)  # Lightest
    ],

    'nord': [
        (46, 52, 64),    # Polar Night
        (59, 66, 82),
        (67, 76, 94),
        (76, 86, 106),
        (216, 222, 233), # Snow Storm
        (229, 233, 240),
        (236, 239, 244),
        (143, 188, 187), # Frost
        (136, 192, 208),
        (129, 161, 193),
        (94, 129, 172),
        (191, 97, 106),  # Aurora
        (208, 135, 112),
        (235, 203, 139),
        (163, 190, 140),
        (180, 142, 173)
    ]
}

PALETTE_METADATA = {
    'bw': {'name': 'Black & White', 'category': 'classic'},
    'gameboy': {'name': 'Game Boy', 'category': 'retro'},
    'gameboy-pocket': {'name': 'Game Boy Pocket', 'category': 'retro'},
    'nes': {'name': 'NES', 'category': 'retro'},
    'c64': {'name': 'Commodore 64', 'category': 'retro'},
    'cga-mode4-p1': {'name': 'CGA Mode 4 (Cyan)', 'category': 'retro'},
    'cga-mode4-p0': {'name': 'CGA Mode 4 (Green)', 'category': 'retro'},
    'sepia': {'name': 'Sepia', 'category': 'artistic'},
    'nord': {'name': 'Nord', 'category': 'modern'}
}

def get_palette(name):
    """Get palette by name, returns B&W if not found."""
    return PALETTES.get(name, PALETTES['bw'])

def get_palette_list():
    """Get list of all available palettes with metadata."""
    return [
        {'id': pid, **PALETTE_METADATA.get(pid, {'name': pid, 'category': 'custom'})}
        for pid in PALETTES.keys()
    ]
```

#### Step 1.2: Create Color Dithering Module

**New File:** `color_dithering.py`

```python
"""
Color dithering algorithms with palette support.

These functions extend the original B&W dithering algorithms to work with
arbitrary color palettes by finding the closest palette color for each pixel
and diffusing the color error across RGB channels.
"""

import numpy as np
from PIL import Image

def find_closest_color(pixel, palette):
    """
    Find the closest color in the palette using Euclidean distance in RGB space.

    Args:
        pixel: RGB tuple (r, g, b)
        palette: List of RGB tuples

    Returns:
        RGB tuple of the closest palette color
    """
    pixel = np.array(pixel)
    palette = np.array(palette)
    distances = np.sqrt(np.sum((palette - pixel) ** 2, axis=1))
    return tuple(palette[np.argmin(distances)])


def floyd_steinberg_color_dither(image, palette):
    """
    Apply Floyd-Steinberg error diffusion dithering with a color palette.

    Args:
        image (PIL.Image): Input RGB image
        palette (list): List of RGB tuples representing available colors

    Returns:
        PIL.Image: Dithered image using only palette colors
    """
    img = image.convert('RGB')
    arr = np.array(img, dtype=float)
    h, w, _ = arr.shape

    for y in range(h):
        for x in range(w):
            old_pixel = arr[y, x].copy()
            new_pixel = np.array(find_closest_color(tuple(old_pixel.astype(int)), palette))
            arr[y, x] = new_pixel
            error = old_pixel - new_pixel

            if x + 1 < w:
                arr[y, x + 1] += error * 7 / 16
            if y + 1 < h:
                if x > 0:
                    arr[y + 1, x - 1] += error * 3 / 16
                arr[y + 1, x] += error * 5 / 16
                if x + 1 < w:
                    arr[y + 1, x + 1] += error * 1 / 16

    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def ordered_color_dither(image, palette):
    """
    Apply ordered dithering with a color palette using luminance-based thresholding.

    Args:
        image (PIL.Image): Input RGB image
        palette (list): List of RGB tuples representing available colors

    Returns:
        PIL.Image: Dithered image using only palette colors
    """
    img = image.convert('RGB')
    arr = np.array(img, dtype=float)
    h, w, _ = arr.shape

    # Sort palette by luminance for ordered dithering
    palette_sorted = sorted(palette, key=lambda c: 0.299*c[0] + 0.587*c[1] + 0.114*c[2])
    n_colors = len(palette_sorted)

    threshold_map = np.array([
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
    ]) / 16

    for y in range(h):
        for x in range(w):
            # Calculate luminance and add threshold offset
            pixel = arr[y, x]
            luminance = (0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2]) / 255
            threshold = threshold_map[y % 4, x % 4]

            # Adjust luminance by threshold and map to palette index
            adjusted = luminance + (threshold - 0.5) / n_colors
            palette_idx = int(np.clip(adjusted * n_colors, 0, n_colors - 1))
            arr[y, x] = palette_sorted[palette_idx]

    return Image.fromarray(arr.astype(np.uint8))


def atkinson_color_dither(image, palette):
    """
    Apply Atkinson error diffusion dithering with a color palette.

    Args:
        image (PIL.Image): Input RGB image
        palette (list): List of RGB tuples representing available colors

    Returns:
        PIL.Image: Dithered image using only palette colors
    """
    img = image.convert('RGB')
    arr = np.array(img, dtype=float)
    h, w, _ = arr.shape

    for y in range(h):
        for x in range(w):
            old_pixel = arr[y, x].copy()
            new_pixel = np.array(find_closest_color(tuple(old_pixel.astype(int)), palette))
            arr[y, x] = new_pixel
            error = (old_pixel - new_pixel) / 8  # Atkinson uses 1/8

            if x + 1 < w:
                arr[y, x + 1] += error
            if x + 2 < w:
                arr[y, x + 2] += error
            if y + 1 < h:
                arr[y + 1, x] += error
                if x + 1 < w:
                    arr[y + 1, x + 1] += error
                if x - 1 >= 0:
                    arr[y + 1, x - 1] += error
            if y + 2 < h:
                arr[y + 2, x] += error

    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def bayer_color_dither(image, palette):
    """
    Apply Bayer matrix ordered dithering with a color palette.

    Args:
        image (PIL.Image): Input RGB image
        palette (list): List of RGB tuples representing available colors

    Returns:
        PIL.Image: Dithered image using only palette colors
    """
    img = image.convert('RGB')
    arr = np.array(img, dtype=float)
    h, w, _ = arr.shape

    # Sort palette by luminance
    palette_sorted = sorted(palette, key=lambda c: 0.299*c[0] + 0.587*c[1] + 0.114*c[2])
    n_colors = len(palette_sorted)

    bayer_matrix = np.array([
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
    ]) / 16

    for y in range(h):
        for x in range(w):
            pixel = arr[y, x]
            luminance = (0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2]) / 255
            threshold = bayer_matrix[y % 4, x % 4]

            adjusted = luminance + (threshold - 0.5) / n_colors
            palette_idx = int(np.clip(adjusted * n_colors, 0, n_colors - 1))
            arr[y, x] = palette_sorted[palette_idx]

    return Image.fromarray(arr.astype(np.uint8))
```

#### Step 1.3: Modify Backend API

**Modify:** `app.py` (lines 55-112)

Add palette parameter support:

```python
# Add imports at top
from palettes import get_palette, get_palette_list, PALETTES
from color_dithering import (
    floyd_steinberg_color_dither,
    ordered_color_dither,
    atkinson_color_dither,
    bayer_color_dither
)

# Add new endpoint for palette list
@app.route('/api/palettes', methods=['GET'])
def list_palettes():
    """Return list of available palettes."""
    return jsonify(get_palette_list())

# Modify dither_image function
@app.route('/dither', methods=['POST'])
def dither_image():
    # ... existing validation code ...

    algorithm = request.form.get('algorithm', 'floyd-steinberg')
    palette_id = request.form.get('palette', 'bw')
    custom_palette = request.form.get('custom_palette')  # JSON string of colors

    # Get palette colors
    if custom_palette:
        import json
        palette = [tuple(c) for c in json.loads(custom_palette)]
    else:
        palette = get_palette(palette_id)

    # Use color dithering if not B&W palette
    if palette_id == 'bw' and not custom_palette:
        # Use original B&W functions for backwards compatibility
        if algorithm == 'floyd-steinberg':
            dithered = floyd_steinberg_dither(img)
        # ... etc
    else:
        # Use color dithering functions
        if algorithm == 'floyd-steinberg':
            dithered = floyd_steinberg_color_dither(img, palette)
        elif algorithm == 'ordered':
            dithered = ordered_color_dither(img, palette)
        elif algorithm == 'atkinson':
            dithered = atkinson_color_dither(img, palette)
        elif algorithm == 'bayer':
            dithered = bayer_color_dither(img, palette)
```

---

### Phase 2: Frontend - Palette Selection UI

#### Step 2.1: Create Palette Preview Component

**New File:** `src/components/PaletteSelector.jsx`

```jsx
import React from 'react';
import { Check } from 'lucide-react';

/**
 * Displays a single palette as a row of color swatches.
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
 * Palette selector component with preset and custom palette support.
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

  return (
    <div className="space-y-4">
      {Object.entries(groupedPalettes).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            {categories[category] || category}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {items.map((palette) => (
              <button
                key={palette.id}
                onClick={() => onSelect(palette.id)}
                className={`
                  flex items-center gap-2 p-2 rounded-lg border-2 transition-colors
                  ${selectedPalette === palette.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <PalettePreview colors={palette.colors} size="sm" />
                <span className="text-sm truncate">{palette.name}</span>
                {selectedPalette === palette.id && (
                  <Check className="h-4 w-4 text-blue-500 ml-auto" />
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
          className="w-full p-2 border rounded-lg text-sm"
          value={customPalette}
          onChange={(e) => onCustomPaletteChange(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1">
          Enter comma-separated hex colors
        </p>
      </div>
    </div>
  );
};

export default PaletteSelector;
```

#### Step 2.2: Modify DitheringPanel.jsx

**Modify:** `src/components/DitheringPanel.jsx`

Add palette state and integration:

```jsx
// Add new state
const [palettes, setPalettes] = useState([]);
const [selectedPalette, setSelectedPalette] = useState(() => {
  return localStorage.getItem('selectedPalette') || 'bw';
});
const [customPalette, setCustomPalette] = useState('');

// Fetch palettes on mount
useEffect(() => {
  fetch('/api/palettes')
    .then(res => res.json())
    .then(setPalettes)
    .catch(console.error);
}, []);

// Persist palette selection
useEffect(() => {
  localStorage.setItem('selectedPalette', selectedPalette);
}, [selectedPalette]);

// Modify handleProcess to include palette
const handleProcess = async () => {
  // ... existing code ...

  for (const fileData of files) {
    for (const algorithm of algorithms) {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('algorithm', algorithm);
      formData.append('palette', selectedPalette);

      if (customPalette) {
        // Parse hex colors to RGB arrays
        const colors = parseHexColors(customPalette);
        formData.append('custom_palette', JSON.stringify(colors));
      }

      // ... rest of processing ...
    }
  }
};

// Add to JSX after algorithm selection
<div className="space-y-4">
  <h3 className="text-lg font-semibold">Color Palette</h3>
  <PaletteSelector
    palettes={palettes}
    selectedPalette={selectedPalette}
    onSelect={setSelectedPalette}
    customPalette={customPalette}
    onCustomPaletteChange={setCustomPalette}
  />
</div>
```

---

### Phase 3: Visual Enhancements

#### Step 3.1: Create Palette Preview Icons

Generate SVG palette preview icons for each preset palette to display in the selector.

#### Step 3.2: Add Result Palette Badge

Show which palette was used on each result card:

```jsx
<span className="text-xs bg-gray-100 px-2 py-1 rounded">
  {result.palette}
</span>
```

---

## API Changes

### New Endpoint

```
GET /api/palettes
Response: [
  { "id": "gameboy", "name": "Game Boy", "category": "retro", "colors": [[15,56,15], ...] },
  ...
]
```

### Modified Endpoint

```
POST /dither
Form Data:
  - file: (binary)
  - algorithm: "floyd-steinberg" | "ordered" | "atkinson" | "bayer"
  - palette: "bw" | "gameboy" | "nes" | ... (optional, default: "bw")
  - custom_palette: "[[255,0,0], [0,255,0]]" (optional, JSON array)
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `palettes.py` | Create | Palette definitions and metadata |
| `color_dithering.py` | Create | Color dithering algorithm implementations |
| `app.py` | Modify | Add palette parameter, new endpoint |
| `api.py` | Modify | Add palette parameter to API blueprint |
| `DitheringPanel.jsx` | Modify | Add palette selection UI and state |
| `PaletteSelector.jsx` | Create | New component for palette selection |

---

## Testing Checklist

- [ ] B&W dithering still works (backwards compatibility)
- [ ] Each preset palette produces correct output colors
- [ ] Custom palette parsing handles edge cases (invalid hex, too few colors)
- [ ] Palette selection persists across page reloads
- [ ] API returns correct palette list
- [ ] Large images with many colors dither in reasonable time
- [ ] All 4 algorithms work with all palettes

---

## Performance Considerations

1. **Color Distance Calculation**: The `find_closest_color` function uses Euclidean distance in RGB space. For larger palettes (NES with 54 colors), consider:
   - Pre-computing a color lookup table for common colors
   - Using a KD-tree for faster nearest-neighbor search
   - Caching results for repeated colors

2. **Memory Usage**: Color dithering uses 3x memory (RGB vs grayscale). For very large images:
   - Process in tiles
   - Use NumPy vectorization where possible

---

## Future Enhancements

1. **Perceptual Color Distance**: Use CIEDE2000 or LAB color space for more accurate color matching
2. **Palette Import/Export**: Allow users to import .pal, .gpl, or .ase palette files
3. **Palette Generation**: Auto-generate palette from source image using k-means clustering
4. **Color Count Slider**: Let users specify exact number of colors (2-256)
