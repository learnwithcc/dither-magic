# Feature 5: Interactive Before/After Comparison Slider

## Implementation Plan

**Priority:** High
**Estimated Complexity:** Low
**Files to Modify:** 2
**New Files:** 1

---

## Overview

Add an interactive split-view comparison slider to the preview modal, allowing users to drag a handle to reveal the original image on one side and the dithered result on the other. This is a crucial UX feature for evaluating algorithm quality.

---

## Technical Approach

### Option A: CSS `clip-path` (Recommended)

Use CSS `clip-path: inset()` to reveal portions of overlapping images based on slider position.

**Pros:**
- Pure CSS, hardware accelerated
- Simple implementation
- Works with any image format
- Smooth performance

**Cons:**
- Requires stacking two full images

### Option B: Canvas Composite

Draw both images to canvas and composite based on slider position.

**Pros:**
- Single canvas element
- Pixel-perfect control

**Cons:**
- More complex implementation
- Requires canvas context management

### Option C: CSS `mask-image`

Use a gradient mask that moves with the slider.

**Pros:**
- Smooth edges possible
- CSS-only

**Cons:**
- Browser support varies
- Less intuitive

**Decision:** Use Option A (CSS `clip-path`) for simplicity and performance.

---

## Component Design

### ComparisonSlider Component

```
┌─────────────────────────────────────────┐
│                                         │
│  Original    │▌│     Dithered          │
│  Image       │▌│     Image             │
│              │▌│                        │
│              │▌│                        │
│              │▌│                        │
│              │▌│                        │
└─────────────────────────────────────────┘
               ↑
          Draggable handle
```

### States
- `sliderPosition`: 0-100 (percentage from left)
- `isDragging`: boolean for drag state

### Props
- `originalSrc`: URL/blob of original image
- `processedSrc`: URL/blob of dithered image
- `initialPosition`: starting slider position (default: 50)

---

## Implementation Steps

### Step 1: Create ComparisonSlider Component

**New File:** `src/components/ui/comparison-slider.jsx`

```jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

/**
 * Interactive before/after image comparison slider.
 *
 * Displays two overlapping images with a draggable divider that reveals
 * the original image on the left and processed image on the right.
 *
 * @component
 * @param {Object} props
 * @param {string} props.originalSrc - URL of the original (before) image
 * @param {string} props.processedSrc - URL of the processed (after) image
 * @param {string} props.originalAlt - Alt text for original image
 * @param {string} props.processedAlt - Alt text for processed image
 * @param {number} props.initialPosition - Initial slider position (0-100)
 * @param {Object} props.style - Additional container styles
 */
const ComparisonSlider = ({
  originalSrc,
  processedSrc,
  originalAlt = 'Original',
  processedAlt = 'Processed',
  initialPosition = 50,
  style = {}
}) => {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  /**
   * Calculate slider position from mouse/touch event
   */
  const calculatePosition = useCallback((clientX) => {
    if (!containerRef.current) return sliderPosition;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    // Clamp between 0 and 100
    return Math.min(100, Math.max(0, percentage));
  }, [sliderPosition]);

  /**
   * Handle mouse down on slider
   */
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * Handle mouse move while dragging
   */
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setSliderPosition(calculatePosition(e.clientX));
  }, [isDragging, calculatePosition]);

  /**
   * Handle mouse up to stop dragging
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle touch events for mobile
   */
  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setSliderPosition(calculatePosition(touch.clientX));
  }, [isDragging, calculatePosition]);

  /**
   * Handle click on container to jump slider position
   */
  const handleContainerClick = useCallback((e) => {
    // Don't jump if clicking on the handle
    if (e.target.closest('.slider-handle')) return;
    setSliderPosition(calculatePosition(e.clientX));
  }, [calculatePosition]);

  // Add/remove global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);

      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-col-resize select-none"
      style={style}
      onClick={handleContainerClick}
    >
      {/* Processed (After) Image - Full width background */}
      <img
        src={processedSrc}
        alt={processedAlt}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        draggable={false}
      />

      {/* Original (Before) Image - Clipped by slider position */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={originalSrc}
          alt={originalAlt}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Slider Handle */}
      <div
        className="slider-handle absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Handle grip */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Vertical line */}
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white -translate-x-1/2" />
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
        Original
      </div>
      <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
        Dithered
      </div>

      {/* Position indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
        {Math.round(sliderPosition)}% / {Math.round(100 - sliderPosition)}%
      </div>
    </div>
  );
};

export default ComparisonSlider;
```

---

### Step 2: Modify DitheringPanel Preview Modal

**Modify:** `src/components/DitheringPanel.jsx`

Add import and integrate comparison slider:

```jsx
// Add import at top
import ComparisonSlider from '@/components/ui/comparison-slider';

// Add state for comparison mode
const [comparisonMode, setComparisonMode] = useState(false);
const [originalImageUrl, setOriginalImageUrl] = useState(null);

// Store original image URL when processing
const handleProcess = async () => {
  // ... existing code ...

  for (const fileData of files) {
    // Create and store original image URL
    const originalUrl = URL.createObjectURL(fileData.file);

    for (const algorithm of algorithms) {
      // ... existing processing code ...

      newResults.push({
        id: `${fileData.id}-${algorithm}`,
        fileName: fileData.name,
        algorithm,
        url,
        originalUrl  // Add reference to original
      });
    }
  }

  // ... rest of function ...
};

// Modify preview modal content (lines 483-534)
<Dialog open={!!previewImage} onOpenChange={() => {
  setPreviewImage(null);
  setComparisonMode(false);
}}>
  <DialogContent className="fixed inset-0 flex items-center justify-center bg-black/50 p-0">
    <DialogTitle className="sr-only">
      {previewImage?.type === 'input' ? 'Original Image' : 'Dithered Image'} Preview
    </DialogTitle>

    <div className="relative w-full h-full max-w-5xl max-h-[90vh] mx-auto flex flex-col">
      {/* Toggle button for comparison mode (only show for output images) */}
      {previewImage?.type === 'output' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setComparisonMode(!comparisonMode)}
            className="bg-white/90 hover:bg-white"
          >
            {comparisonMode ? 'Exit Comparison' : 'Compare with Original'}
          </Button>
        </div>
      )}

      {/* Image display area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {comparisonMode && previewImage?.type === 'output' ? (
          <ComparisonSlider
            originalSrc={previewImage.originalUrl}
            processedSrc={previewImage.url}
            originalAlt={`Original: ${previewImage.fileName}`}
            processedAlt={`${previewImage.algorithm}: ${previewImage.fileName}`}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <img
            src={previewImage?.type === 'input'
              ? URL.createObjectURL(previewImage.file.file)
              : previewImage?.url
            }
            alt={previewImage?.type === 'input'
              ? previewImage.file.name
              : previewImage?.fileName
            }
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${zoom})` }}
          />
        )}
      </div>

      {/* Navigation controls (hide in comparison mode) */}
      {!comparisonMode && (
        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
          {/* ... existing navigation buttons ... */}
        </div>
      )}

      {/* Zoom controls (hide in comparison mode) */}
      {!comparisonMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-black/20 p-2 rounded-lg">
          {/* ... existing zoom controls ... */}
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>
```

---

### Step 3: Add Keyboard Shortcuts

Add keyboard support for comparison toggle:

```jsx
// Modify the keyboard event handler (lines 153-172)
useEffect(() => {
  const handleKeyDown = (e) => {
    if (!previewImage) return;

    switch(e.key) {
      case 'ArrowLeft':
        if (!comparisonMode) handleNavigatePrev();
        break;
      case 'ArrowRight':
        if (!comparisonMode) handleNavigateNext();
        break;
      case 'Escape':
        if (comparisonMode) {
          setComparisonMode(false);
        } else {
          setPreviewImage(null);
        }
        break;
      case 'c':
      case 'C':
        // Toggle comparison mode with 'C' key
        if (previewImage?.type === 'output') {
          setComparisonMode(!comparisonMode);
        }
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [previewImage, comparisonMode]);
```

---

### Step 4: Add Quick Compare Button to Result Cards

Add inline comparison button on result thumbnails:

```jsx
// In results grid (around line 452)
<img
  src={result.url}
  alt={`${result.algorithm} - ${result.fileName}`}
  className="w-full h-32 object-cover rounded-md cursor-pointer"
  onClick={() => setPreviewImage({ ...result, type: 'output' })}
/>

{/* Add quick compare button */}
<Button
  variant="ghost"
  size="sm"
  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
  onClick={(e) => {
    e.stopPropagation();
    setPreviewImage({ ...result, type: 'output' });
    setComparisonMode(true);
  }}
>
  <SplitSquareHorizontal className="h-4 w-4" />
</Button>
```

Add icon import:
```jsx
import { SplitSquareHorizontal } from 'lucide-react';
```

---

## Enhanced Features

### Vertical Comparison Mode

Add option to switch between horizontal and vertical split:

```jsx
const [splitDirection, setSplitDirection] = useState('horizontal');

// In ComparisonSlider, modify clip-path based on direction:
style={{
  clipPath: splitDirection === 'horizontal'
    ? `inset(0 ${100 - sliderPosition}% 0 0)`
    : `inset(0 0 ${100 - sliderPosition}% 0)`
}}
```

### Swap Sides Button

Allow users to swap which side shows original vs processed:

```jsx
const [swapped, setSwapped] = useState(false);

<Button onClick={() => setSwapped(!swapped)}>
  <ArrowLeftRight className="h-4 w-4" />
</Button>

// In ComparisonSlider:
<img src={swapped ? processedSrc : originalSrc} ... />
<img src={swapped ? originalSrc : processedSrc} ... />
```

### Quick A/B Toggle

Add ability to quickly flash between images:

```jsx
const [showOriginal, setShowOriginal] = useState(false);

// On spacebar press:
case ' ':
  e.preventDefault();
  setShowOriginal(!showOriginal);
  break;
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui/comparison-slider.jsx` | Create | New comparison slider component |
| `src/components/DitheringPanel.jsx` | Modify | Add comparison mode state, toggle button, integrate slider |

---

## CSS Styling Details

### Slider Handle Styles

```css
/* Smooth transition for slider movement */
.slider-handle {
  transition: left 0.05s ease-out;
}

/* Disable transition while dragging for responsiveness */
.slider-handle.dragging {
  transition: none;
}

/* Handle hover state */
.slider-handle:hover > div {
  background-color: #f3f4f6;
  transform: translate(-50%, -50%) scale(1.1);
}

/* Handle active state */
.slider-handle:active > div {
  transform: translate(-50%, -50%) scale(0.95);
}
```

### Container Styles

```css
/* Ensure images fill container properly */
.comparison-container img {
  user-select: none;
  -webkit-user-drag: none;
}

/* Smooth clip-path animation */
.comparison-original {
  transition: clip-path 0.05s ease-out;
}
```

---

## Accessibility Considerations

### ARIA Labels

```jsx
<div
  role="slider"
  aria-label="Image comparison slider"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={sliderPosition}
  aria-valuetext={`${Math.round(sliderPosition)}% original, ${Math.round(100 - sliderPosition)}% processed`}
  tabIndex={0}
  onKeyDown={handleSliderKeyboard}
>
```

### Keyboard Navigation

```jsx
const handleSliderKeyboard = (e) => {
  switch (e.key) {
    case 'ArrowLeft':
      setSliderPosition(pos => Math.max(0, pos - 5));
      break;
    case 'ArrowRight':
      setSliderPosition(pos => Math.min(100, pos + 5));
      break;
    case 'Home':
      setSliderPosition(0);
      break;
    case 'End':
      setSliderPosition(100);
      break;
  }
};
```

---

## Testing Checklist

### Functional Tests
- [ ] Slider moves smoothly with mouse drag
- [ ] Slider moves smoothly with touch drag on mobile
- [ ] Click on container jumps slider to position
- [ ] Keyboard navigation works (arrow keys, Home, End)
- [ ] Comparison toggle button shows/hides correctly
- [ ] 'C' key toggles comparison mode
- [ ] Escape exits comparison mode (then preview)
- [ ] Original image displays on left side
- [ ] Processed image displays on right side

### Visual Tests
- [ ] Images align perfectly at split point
- [ ] Handle is visible and styled correctly
- [ ] Labels display in corners
- [ ] Position indicator updates in real-time
- [ ] No layout shift when entering comparison mode

### Edge Cases
- [ ] Works with images of different aspect ratios
- [ ] Works with very wide images
- [ ] Works with very tall images
- [ ] Works when zoomed in browser
- [ ] Touch events don't conflict with scroll on mobile

### Performance Tests
- [ ] Smooth 60fps during drag
- [ ] No memory leaks from event listeners
- [ ] Large images don't cause lag

---

## Mobile Considerations

### Touch Handling

- Use `touchstart` and `touchmove` events
- Prevent default scroll on vertical swipe in horizontal mode
- Consider larger touch target for handle (44x44px minimum)

### Responsive Layout

```jsx
// Adjust handle size for touch devices
const handleSize = window.matchMedia('(pointer: coarse)').matches
  ? 'w-12 h-16'  // Larger for touch
  : 'w-8 h-12';  // Standard for mouse
```

---

## Future Enhancements

1. **Side-by-Side Mode**: Alternative to overlay, show images side by side
2. **Multi-Image Comparison**: Compare multiple algorithm outputs simultaneously
3. **Onion Skin Mode**: Adjust opacity instead of position for overlay comparison
4. **Lens Mode**: Circular comparison lens that follows cursor
5. **Difference View**: Show pixel difference between images
6. **Animation**: Auto-animate slider back and forth for demo
