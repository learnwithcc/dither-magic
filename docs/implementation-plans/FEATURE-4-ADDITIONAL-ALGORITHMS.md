# Feature 4: Additional Dithering Algorithms

## Implementation Plan

**Priority:** Medium-High
**Estimated Complexity:** Low-Medium
**Files to Modify:** 4
**New Files:** 0

---

## Overview

Expand the algorithm library from 4 to 12+ algorithms, adding popular error diffusion variants (Stucki, Jarvis-Judice-Ninke, Burkes, Sierra family) and modern techniques (Riemersma, Blue Noise).

---

## Current State Analysis

### Existing Algorithms in `dithering.py`

| Algorithm | Type | Lines | Error Distribution |
|-----------|------|-------|-------------------|
| Floyd-Steinberg | Error Diffusion | 12-56 | 7/16, 3/16, 5/16, 1/16 |
| Ordered | Threshold | 58-97 | 4x4 threshold map |
| Atkinson | Error Diffusion | 99-151 | 6×(1/8), discards 2/8 |
| Bayer | Threshold | 153-190 | 4x4 normalized Bayer |

### Code Pattern

Each algorithm follows this structure:
```python
def algorithm_name_dither(image):
    """Docstring with description."""
    img = image.convert('L')
    arr = np.array(img, dtype=float)  # or dtype=uint8 for threshold
    h, w = arr.shape

    # Algorithm-specific processing
    for y in range(h):
        for x in range(w):
            # Pixel manipulation

    return Image.fromarray(arr.astype(np.uint8))
```

---

## New Algorithms to Implement

### Error Diffusion Family

These algorithms differ primarily in their error distribution kernels.

#### 1. Stucki Dithering

**Characteristics:**
- Larger 3-row kernel than Floyd-Steinberg
- Smoother gradients, less pattern visibility
- Slightly slower due to larger kernel

**Error Distribution Kernel:**
```
            X    8/42   4/42
    2/42   4/42  8/42   4/42   2/42
    1/42   2/42  4/42   2/42   1/42
```

**Implementation:**

```python
def stucki_dither(image):
    """
    Apply Stucki error diffusion dithering to an image.

    Stucki dithering uses a larger error distribution kernel than
    Floyd-Steinberg, resulting in smoother gradients and less visible
    patterning. The kernel extends 2 pixels right and 2 rows down.

    Error distribution pattern (denominator = 42):
                X     8    4
            2   4     8    4    2
            1   2     4    2    1

    Args:
        image (PIL.Image): Input image to be dithered.

    Returns:
        PIL.Image: Dithered black and white image.
    """
    img = image.convert('L')
    arr = np.array(img, dtype=float)
    h, w = arr.shape

    for y in range(h):
        for x in range(w):
            old_pixel = arr[y, x]
            new_pixel = 255 if old_pixel > 127 else 0
            arr[y, x] = new_pixel
            error = old_pixel - new_pixel

            # Row 0 (current row)
            if x + 1 < w:
                arr[y, x + 1] += error * 8 / 42
            if x + 2 < w:
                arr[y, x + 2] += error * 4 / 42

            # Row 1
            if y + 1 < h:
                if x - 2 >= 0:
                    arr[y + 1, x - 2] += error * 2 / 42
                if x - 1 >= 0:
                    arr[y + 1, x - 1] += error * 4 / 42
                arr[y + 1, x] += error * 8 / 42
                if x + 1 < w:
                    arr[y + 1, x + 1] += error * 4 / 42
                if x + 2 < w:
                    arr[y + 1, x + 2] += error * 2 / 42

            # Row 2
            if y + 2 < h:
                if x - 2 >= 0:
                    arr[y + 2, x - 2] += error * 1 / 42
                if x - 1 >= 0:
                    arr[y + 2, x - 1] += error * 2 / 42
                arr[y + 2, x] += error * 4 / 42
                if x + 1 < w:
                    arr[y + 2, x + 1] += error * 2 / 42
                if x + 2 < w:
                    arr[y + 2, x + 2] += error * 1 / 42

    return Image.fromarray(arr.astype(np.uint8))
```

---

#### 2. Jarvis-Judice-Ninke Dithering

**Characteristics:**
- Same kernel size as Stucki (3 rows, 5 columns)
- Different weights, optimized for photographic images
- Excellent for preserving detail

**Error Distribution Kernel:**
```
            X    7/48   5/48
    3/48   5/48  7/48   5/48   3/48
    1/48   3/48  5/48   3/48   1/48
```

**Implementation:**

```python
def jarvis_dither(image):
    """
    Apply Jarvis-Judice-Ninke error diffusion dithering to an image.

    This algorithm uses a large error distribution kernel similar to Stucki
    but with different weights optimized for photographic images. It produces
    high-quality results with excellent detail preservation.

    Error distribution pattern (denominator = 48):
                X     7    5
            3   5     7    5    3
            1   3     5    3    1

    Args:
        image (PIL.Image): Input image to be dithered.

    Returns:
        PIL.Image: Dithered black and white image.
    """
    img = image.convert('L')
    arr = np.array(img, dtype=float)
    h, w = arr.shape

    for y in range(h):
        for x in range(w):
            old_pixel = arr[y, x]
            new_pixel = 255 if old_pixel > 127 else 0
            arr[y, x] = new_pixel
            error = old_pixel - new_pixel

            # Row 0
            if x + 1 < w:
                arr[y, x + 1] += error * 7 / 48
            if x + 2 < w:
                arr[y, x + 2] += error * 5 / 48

            # Row 1
            if y + 1 < h:
                if x - 2 >= 0:
                    arr[y + 1, x - 2] += error * 3 / 48
                if x - 1 >= 0:
                    arr[y + 1, x - 1] += error * 5 / 48
                arr[y + 1, x] += error * 7 / 48
                if x + 1 < w:
                    arr[y + 1, x + 1] += error * 5 / 48
                if x + 2 < w:
                    arr[y + 1, x + 2] += error * 3 / 48

            # Row 2
            if y + 2 < h:
                if x - 2 >= 0:
                    arr[y + 2, x - 2] += error * 1 / 48
                if x - 1 >= 0:
                    arr[y + 2, x - 1] += error * 3 / 48
                arr[y + 2, x] += error * 5 / 48
                if x + 1 < w:
                    arr[y + 2, x + 1] += error * 3 / 48
                if x + 2 < w:
                    arr[y + 2, x + 2] += error * 1 / 48

    return Image.fromarray(arr.astype(np.uint8))
```

---

#### 3. Burkes Dithering

**Characteristics:**
- Simplified 2-row kernel (faster than Stucki/Jarvis)
- Good balance between quality and speed
- Similar to Floyd-Steinberg but with extended reach

**Error Distribution Kernel:**
```
            X    8/32   4/32
    2/32   4/32  8/32   4/32   2/32
```

**Implementation:**

```python
def burkes_dither(image):
    """
    Apply Burkes error diffusion dithering to an image.

    Burkes dithering uses a simplified 2-row kernel that's faster than
    Stucki or Jarvis while producing similar quality results. It offers
    a good balance between speed and output quality.

    Error distribution pattern (denominator = 32):
                X     8    4
            2   4     8    4    2

    Args:
        image (PIL.Image): Input image to be dithered.

    Returns:
        PIL.Image: Dithered black and white image.
    """
    img = image.convert('L')
    arr = np.array(img, dtype=float)
    h, w = arr.shape

    for y in range(h):
        for x in range(w):
            old_pixel = arr[y, x]
            new_pixel = 255 if old_pixel > 127 else 0
            arr[y, x] = new_pixel
            error = old_pixel - new_pixel

            # Row 0
            if x + 1 < w:
                arr[y, x + 1] += error * 8 / 32
            if x + 2 < w:
                arr[y, x + 2] += error * 4 / 32

            # Row 1
            if y + 1 < h:
                if x - 2 >= 0:
                    arr[y + 1, x - 2] += error * 2 / 32
                if x - 1 >= 0:
                    arr[y + 1, x - 1] += error * 4 / 32
                arr[y + 1, x] += error * 8 / 32
                if x + 1 < w:
                    arr[y + 1, x + 1] += error * 4 / 32
                if x + 2 < w:
                    arr[y + 1, x + 2] += error * 2 / 32

    return Image.fromarray(arr.astype(np.uint8))
```

---

#### 4. Sierra (3-Row) Dithering

**Characteristics:**
- Full 3-row Sierra kernel
- Excellent quality, minimal artifacts
- Good for high-contrast images

**Error Distribution Kernel:**
```
            X    5/32   3/32
    2/32   4/32  5/32   4/32   2/32
           2/32  3/32   2/32
```

**Implementation:**

```python
def sierra_dither(image):
    """
    Apply Sierra (3-row) error diffusion dithering to an image.

    The full Sierra algorithm uses a 3-row kernel that produces excellent
    quality with minimal visible artifacts. It's particularly good for
    images with high contrast.

    Error distribution pattern (denominator = 32):
                X     5    3
            2   4     5    4    2
                2     3    2

    Args:
        image (PIL.Image): Input image to be dithered.

    Returns:
        PIL.Image: Dithered black and white image.
    """
    img = image.convert('L')
    arr = np.array(img, dtype=float)
    h, w = arr.shape

    for y in range(h):
        for x in range(w):
            old_pixel = arr[y, x]
            new_pixel = 255 if old_pixel > 127 else 0
            arr[y, x] = new_pixel
            error = old_pixel - new_pixel

            # Row 0
            if x + 1 < w:
                arr[y, x + 1] += error * 5 / 32
            if x + 2 < w:
                arr[y, x + 2] += error * 3 / 32

            # Row 1
            if y + 1 < h:
                if x - 2 >= 0:
                    arr[y + 1, x - 2] += error * 2 / 32
                if x - 1 >= 0:
                    arr[y + 1, x - 1] += error * 4 / 32
                arr[y + 1, x] += error * 5 / 32
                if x + 1 < w:
                    arr[y + 1, x + 1] += error * 4 / 32
                if x + 2 < w:
                    arr[y + 1, x + 2] += error * 2 / 32

            # Row 2
            if y + 2 < h:
                if x - 1 >= 0:
                    arr[y + 2, x - 1] += error * 2 / 32
                arr[y + 2, x] += error * 3 / 32
                if x + 1 < w:
                    arr[y + 2, x + 1] += error * 2 / 32

    return Image.fromarray(arr.astype(np.uint8))
```

---

#### 5. Sierra Two-Row Dithering

**Characteristics:**
- Simplified 2-row version
- Faster than full Sierra
- Maintains good quality

**Error Distribution Kernel:**
```
            X    4/16   3/16
    1/16   2/16  3/16   2/16   1/16
```

**Implementation:**

```python
def sierra_two_row_dither(image):
    """
    Apply Sierra Two-Row error diffusion dithering to an image.

    A simplified version of the full Sierra algorithm using only 2 rows.
    Faster processing while maintaining good output quality.

    Error distribution pattern (denominator = 16):
                X     4    3
            1   2     3    2    1

    Args:
        image (PIL.Image): Input image to be dithered.

    Returns:
        PIL.Image: Dithered black and white image.
    """
    img = image.convert('L')
    arr = np.array(img, dtype=float)
    h, w = arr.shape

    for y in range(h):
        for x in range(w):
            old_pixel = arr[y, x]
            new_pixel = 255 if old_pixel > 127 else 0
            arr[y, x] = new_pixel
            error = old_pixel - new_pixel

            # Row 0
            if x + 1 < w:
                arr[y, x + 1] += error * 4 / 16
            if x + 2 < w:
                arr[y, x + 2] += error * 3 / 16

            # Row 1
            if y + 1 < h:
                if x - 2 >= 0:
                    arr[y + 1, x - 2] += error * 1 / 16
                if x - 1 >= 0:
                    arr[y + 1, x - 1] += error * 2 / 16
                arr[y + 1, x] += error * 3 / 16
                if x + 1 < w:
                    arr[y + 1, x + 1] += error * 2 / 16
                if x + 2 < w:
                    arr[y + 1, x + 2] += error * 1 / 16

    return Image.fromarray(arr.astype(np.uint8))
```

---

#### 6. Sierra Lite Dithering

**Characteristics:**
- Minimal 2-pixel kernel
- Fastest Sierra variant
- Suitable for quick previews

**Error Distribution Kernel:**
```
        X    2/4
    1/4 1/4
```

**Implementation:**

```python
def sierra_lite_dither(image):
    """
    Apply Sierra Lite error diffusion dithering to an image.

    The fastest Sierra variant using a minimal kernel of just 3 pixels.
    Suitable for quick previews or when processing speed is critical.

    Error distribution pattern (denominator = 4):
            X    2
        1   1

    Args:
        image (PIL.Image): Input image to be dithered.

    Returns:
        PIL.Image: Dithered black and white image.
    """
    img = image.convert('L')
    arr = np.array(img, dtype=float)
    h, w = arr.shape

    for y in range(h):
        for x in range(w):
            old_pixel = arr[y, x]
            new_pixel = 255 if old_pixel > 127 else 0
            arr[y, x] = new_pixel
            error = old_pixel - new_pixel

            if x + 1 < w:
                arr[y, x + 1] += error * 2 / 4
            if y + 1 < h:
                if x - 1 >= 0:
                    arr[y + 1, x - 1] += error * 1 / 4
                arr[y + 1, x] += error * 1 / 4

    return Image.fromarray(arr.astype(np.uint8))
```

---

### Advanced Techniques

#### 7. Halftone (Circular Dots)

**Characteristics:**
- Creates classic print-style halftone pattern
- Configurable dot size
- Artistic/print aesthetic

**Implementation:**

```python
def halftone_dither(image, dot_size=4):
    """
    Apply halftone dithering to create a classic print-style effect.

    Creates circular dots of varying sizes based on local image intensity.
    Larger dots appear in darker areas, smaller dots in lighter areas.

    Args:
        image (PIL.Image): Input image to be dithered.
        dot_size (int): Size of halftone cells in pixels (default: 4).

    Returns:
        PIL.Image: Halftone dithered image.
    """
    img = image.convert('L')
    arr = np.array(img)
    h, w = arr.shape

    # Create output array (white background)
    output = np.ones((h, w), dtype=np.uint8) * 255

    # Create coordinate grids for circle calculations
    y_coords, x_coords = np.ogrid[:dot_size, :dot_size]
    center = dot_size / 2

    for y in range(0, h - dot_size + 1, dot_size):
        for x in range(0, w - dot_size + 1, dot_size):
            # Calculate average intensity in this cell
            cell = arr[y:y + dot_size, x:x + dot_size]
            avg_intensity = np.mean(cell)

            # Calculate dot radius based on intensity (darker = larger)
            max_radius = dot_size / 2
            radius = max_radius * (1 - avg_intensity / 255)

            # Create circular mask
            distance = np.sqrt((x_coords - center + 0.5) ** 2 +
                             (y_coords - center + 0.5) ** 2)
            mask = distance <= radius

            # Apply dot
            output[y:y + dot_size, x:x + dot_size][mask] = 0

    return Image.fromarray(output)
```

---

#### 8. Blue Noise Dithering

**Characteristics:**
- Modern stochastic dithering technique
- Even distribution without visible patterns
- Film grain aesthetic
- Requires pre-generated blue noise texture

**Implementation:**

```python
def generate_blue_noise(size=64):
    """
    Generate a blue noise threshold map using void-and-cluster algorithm.

    This is a simplified implementation. For production, consider
    pre-computing or using an existing blue noise texture.

    Args:
        size (int): Size of the blue noise texture (size x size).

    Returns:
        np.ndarray: Blue noise threshold map normalized to [0, 1].
    """
    # Simplified blue noise using sorted random positions
    # Full implementation would use void-and-cluster algorithm
    np.random.seed(42)  # Reproducible
    noise = np.random.rand(size, size)

    # Apply Gaussian blur and normalize to spread values
    from scipy.ndimage import gaussian_filter
    noise = gaussian_filter(noise, sigma=1.5)
    noise = (noise - noise.min()) / (noise.max() - noise.min())

    return noise


# Pre-generate blue noise texture
BLUE_NOISE_MAP = None

def blue_noise_dither(image):
    """
    Apply blue noise dithering to an image.

    Blue noise dithering uses a specially crafted threshold texture that
    produces evenly distributed dots without visible patterns. The result
    has a film grain-like quality that's pleasing to the eye.

    Args:
        image (PIL.Image): Input image to be dithered.

    Returns:
        PIL.Image: Blue noise dithered image.
    """
    global BLUE_NOISE_MAP

    if BLUE_NOISE_MAP is None:
        BLUE_NOISE_MAP = generate_blue_noise(64)

    img = image.convert('L')
    arr = np.array(img, dtype=float) / 255.0
    h, w = arr.shape

    noise_h, noise_w = BLUE_NOISE_MAP.shape

    for y in range(h):
        for x in range(w):
            threshold = BLUE_NOISE_MAP[y % noise_h, x % noise_w]
            arr[y, x] = 255 if arr[y, x] > threshold else 0

    return Image.fromarray(arr.astype(np.uint8))
```

---

## Implementation Steps

### Step 1: Add Algorithms to `dithering.py`

Append all new algorithm functions to the existing file, maintaining the same docstring style and structure.

```python
# At end of dithering.py, add:

def stucki_dither(image):
    # ... implementation ...

def jarvis_dither(image):
    # ... implementation ...

def burkes_dither(image):
    # ... implementation ...

def sierra_dither(image):
    # ... implementation ...

def sierra_two_row_dither(image):
    # ... implementation ...

def sierra_lite_dither(image):
    # ... implementation ...

def halftone_dither(image):
    # ... implementation ...

def blue_noise_dither(image):
    # ... implementation ...
```

### Step 2: Update `app.py` Route Handler

**Modify:** `app.py` lines 14, 93-100

```python
# Update import
from dithering import (
    floyd_steinberg_dither, ordered_dither, atkinson_dither, bayer_dither,
    stucki_dither, jarvis_dither, burkes_dither,
    sierra_dither, sierra_two_row_dither, sierra_lite_dither,
    halftone_dither, blue_noise_dither
)

# Update algorithm selection in dither_image()
ALGORITHMS = {
    'floyd-steinberg': floyd_steinberg_dither,
    'ordered': ordered_dither,
    'atkinson': atkinson_dither,
    'bayer': bayer_dither,
    'stucki': stucki_dither,
    'jarvis': jarvis_dither,
    'burkes': burkes_dither,
    'sierra': sierra_dither,
    'sierra-two-row': sierra_two_row_dither,
    'sierra-lite': sierra_lite_dither,
    'halftone': halftone_dither,
    'blue-noise': blue_noise_dither
}

algorithm = request.form.get('algorithm', 'floyd-steinberg')
if algorithm not in ALGORITHMS:
    return jsonify({'error': 'Invalid algorithm'}), 400

dithered = ALGORITHMS[algorithm](img)
```

### Step 3: Update `api.py` Similarly

Apply the same changes to the API blueprint.

### Step 4: Update Frontend State

**Modify:** `src/components/DitheringPanel.jsx` lines 48-56

```javascript
const [selectedAlgorithms, setSelectedAlgorithms] = useState(() => {
  const saved = localStorage.getItem('selectedAlgorithms');
  return saved ? JSON.parse(saved) : {
    'floyd-steinberg': true,
    'ordered': false,
    'atkinson': false,
    'bayer': false,
    'stucki': false,
    'jarvis': false,
    'burkes': false,
    'sierra': false,
    'sierra-two-row': false,
    'sierra-lite': false,
    'halftone': false,
    'blue-noise': false
  };
});
```

### Step 5: Update Algorithm Icons Mapping

**Modify:** `src/components/DitheringPanel.jsx` lines 24-29

```javascript
const algorithmIcons = {
  'floyd-steinberg': '/static/img/algorithms/floyd-steinberg.svg',
  'ordered': '/static/img/algorithms/ordered.svg',
  'atkinson': '/static/img/algorithms/atkinson.svg',
  'bayer': '/static/img/algorithms/bayer.svg',
  'stucki': '/static/img/algorithms/stucki.svg',
  'jarvis': '/static/img/algorithms/jarvis.svg',
  'burkes': '/static/img/algorithms/burkes.svg',
  'sierra': '/static/img/algorithms/sierra.svg',
  'sierra-two-row': '/static/img/algorithms/sierra-two-row.svg',
  'sierra-lite': '/static/img/algorithms/sierra-lite.svg',
  'halftone': '/static/img/algorithms/halftone.svg',
  'blue-noise': '/static/img/algorithms/blue-noise.svg'
};
```

### Step 6: Create Algorithm Icons

Create new SVG icons for each algorithm in `assets/` directory:

| Algorithm | Icon Style Description |
|-----------|----------------------|
| stucki | Smooth gradient pattern |
| jarvis | Detailed gradient |
| burkes | Medium gradient |
| sierra | Fine detail pattern |
| sierra-two-row | Horizontal bands |
| sierra-lite | Simple gradient |
| halftone | Circular dots |
| blue-noise | Random speckle |

### Step 7: Update Algorithm Selection UI

Consider grouping algorithms by category:

```jsx
const algorithmCategories = {
  'Error Diffusion (Classic)': ['floyd-steinberg', 'atkinson'],
  'Error Diffusion (Extended)': ['stucki', 'jarvis', 'burkes'],
  'Sierra Family': ['sierra', 'sierra-two-row', 'sierra-lite'],
  'Ordered/Pattern': ['ordered', 'bayer', 'halftone'],
  'Modern': ['blue-noise']
};
```

---

## File Changes Summary

| File | Action | Lines Changed | Description |
|------|--------|--------------|-------------|
| `dithering.py` | Modify | +250 | Add 8 new algorithm functions |
| `app.py` | Modify | +15 | Update imports, add algorithm dict |
| `api.py` | Modify | +15 | Mirror app.py changes |
| `DitheringPanel.jsx` | Modify | +20 | Add new algorithms to state/icons |
| `assets/*.svg` | Create | 8 files | New algorithm icons |

---

## Algorithm Comparison Reference

| Algorithm | Speed | Quality | Pattern | Best For |
|-----------|-------|---------|---------|----------|
| Floyd-Steinberg | Medium | Good | Slight diagonal | General use |
| Atkinson | Medium | Good | High contrast | Mac classic style |
| Stucki | Slow | Excellent | Very smooth | Photos |
| Jarvis | Slow | Excellent | Detailed | High-detail images |
| Burkes | Medium | Good | Balanced | Fast quality |
| Sierra | Slow | Excellent | Minimal artifacts | High contrast |
| Sierra Two-Row | Medium | Good | Slight banding | Balanced |
| Sierra Lite | Fast | Fair | Some artifacts | Quick preview |
| Ordered | Fast | Fair | Grid pattern | Retro/8-bit |
| Bayer | Fast | Fair | Regular dots | Retro/print |
| Halftone | Fast | Good | Circular dots | Print style |
| Blue Noise | Medium | Excellent | Film grain | Modern aesthetic |

---

## Testing Checklist

- [ ] Each new algorithm produces valid output
- [ ] No memory leaks with large images
- [ ] Algorithm names display correctly in UI
- [ ] Icons render for all algorithms
- [ ] localStorage persists new algorithm selections
- [ ] API accepts all new algorithm names
- [ ] Error handling for invalid algorithm names
- [ ] Performance acceptable for all algorithms

---

## Performance Optimization Notes

### Vectorization Opportunity

The error diffusion algorithms use nested loops which are slow in Python. Consider NumPy vectorization for production:

```python
# Example: Vectorized threshold application for ordered dithering
def ordered_dither_vectorized(image):
    img = image.convert('L')
    arr = np.array(img)
    h, w = arr.shape

    threshold_map = np.array([...]) * 16

    # Tile threshold map to image size
    threshold = np.tile(threshold_map, (h // 4 + 1, w // 4 + 1))[:h, :w]

    # Vectorized comparison
    result = np.where(arr > threshold, 255, 0).astype(np.uint8)

    return Image.fromarray(result)
```

### Cython Alternative

For maximum performance, error diffusion algorithms could be rewritten in Cython:

```python
# dithering_fast.pyx (future optimization)
cimport numpy as np

def floyd_steinberg_fast(np.ndarray[np.float64_t, ndim=2] arr):
    cdef int h = arr.shape[0]
    cdef int w = arr.shape[1]
    cdef int x, y
    cdef double old_pixel, new_pixel, error
    # ... C-speed implementation
```

---

## Future Enhancements

1. **Algorithm Parameters**: Add configurable parameters (e.g., halftone dot size, threshold value)
2. **Serpentine Scanning**: Add option for bidirectional row scanning to reduce artifacts
3. **Custom Kernels**: Allow users to define their own error diffusion kernels
4. **GPU Acceleration**: WebGL shader implementations for real-time preview
