# Dithering Algorithms Reference

This document provides detailed technical information about each dithering algorithm implemented in Dither Magic.

## Overview

Dithering is a technique used to create the illusion of color depth in images with a limited color palette. All algorithms in this application convert images to black and white (1-bit) output.

## Error Diffusion Algorithms

Error diffusion algorithms work by distributing quantization errors to neighboring pixels. When a pixel is converted to black or white, the "error" (difference between the original value and the chosen value) is spread to nearby unprocessed pixels.

### Floyd-Steinberg

**Type**: Classic error diffusion

**Description**: The most well-known dithering algorithm, developed by Robert Floyd and Louis Steinberg in 1976. It's the gold standard for general-purpose dithering.

**Error Distribution**:
```
    *   7/16
3/16 5/16 1/16
```
Where `*` is the current pixel.

**Characteristics**:
- Distributes error to 4 neighboring pixels
- Good balance of quality and speed
- Excellent for general use
- Produces natural-looking results

**Best For**: General-purpose dithering, photographs, artwork

---

### Atkinson

**Type**: Modified error diffusion

**Description**: Created by Bill Atkinson for the original Apple Macintosh. It has a distinctive bright, high-contrast appearance reminiscent of classic Mac graphics.

**Error Distribution**:
```
    *  1/8 1/8
1/8 1/8 1/8
   1/8
```
Note: Only distributes 6/8 of error (discards 2/8)

**Characteristics**:
- Lighter, brighter appearance than Floyd-Steinberg
- Higher contrast
- More distinct patterns in midtones
- Preserves details in highlights

**Best For**: Retro aesthetic, high-contrast images, line art

---

### Stucki

**Type**: Extended error diffusion

**Description**: Developed by P. Stucki, this algorithm uses a larger kernel than Floyd-Steinberg, distributing error to more pixels for smoother gradients.

**Error Distribution**:
```
        *   8/42 4/42
2/42 4/42 8/42 4/42 2/42
1/42 2/42 4/42 2/42 1/42
```

**Characteristics**:
- Distributes error to 12 neighboring pixels
- Smoother gradients than Floyd-Steinberg
- Less visible patterns
- Slightly slower due to larger kernel

**Best For**: Photographs with smooth gradients, portraits

---

### Jarvis-Judice-Ninke

**Type**: Extended error diffusion

**Description**: Named after its creators, this algorithm (also known as Jarvis) uses the largest error diffusion kernel, providing excellent detail preservation.

**Error Distribution**:
```
        *   7/48 5/48
3/48 5/48 7/48 5/48 3/48
1/48 3/48 5/48 3/48 1/48
```

**Characteristics**:
- Distributes error to 12 neighboring pixels
- Excellent detail preservation
- Very smooth gradients
- High quality output
- Slower processing due to large kernel

**Best For**: High-quality photographs, detailed images, professional output

---

### Burkes

**Type**: Simplified error diffusion

**Description**: A faster alternative to Stucki, using a 2-row kernel instead of 3 rows while maintaining good quality.

**Error Distribution**:
```
      *   8/32 4/32
2/32 4/32 8/32 4/32 2/32
```

**Characteristics**:
- Distributes error to 7 neighboring pixels
- Good balance between speed and quality
- Faster than Stucki/Jarvis
- Similar quality to more complex algorithms

**Best For**: Quick processing, batch operations, general use

---

### Sierra (3-Row)

**Type**: Sierra family error diffusion

**Description**: The full Sierra algorithm, part of a family of algorithms developed by Frankie Sierra. Known for producing minimal artifacts.

**Error Distribution**:
```
        *   5/32 3/32
2/32 4/32 5/32 4/32 2/32
    2/32 3/32 2/32
```

**Characteristics**:
- Distributes error to 10 neighboring pixels
- Minimal artifacts and patterns
- Excellent for high-contrast images
- Smooth transitions

**Best For**: High-contrast images, graphics, clean results

---

### Sierra Two-Row

**Type**: Sierra family (simplified)

**Description**: A simplified 2-row version of Sierra, offering faster processing while maintaining good quality.

**Error Distribution**:
```
      *   4/16 3/16
1/16 2/16 3/16 2/16 1/16
```

**Characteristics**:
- Distributes error to 7 neighboring pixels
- Faster than full Sierra
- Good quality output
- Less artifacts than Floyd-Steinberg

**Best For**: Quick processing with good quality, general use

---

### Sierra Lite

**Type**: Sierra family (minimal)

**Description**: The fastest Sierra variant, using only 3 neighboring pixels. Ideal for quick previews or when speed is critical.

**Error Distribution**:
```
  *  2/4
1/4 1/4
```

**Characteristics**:
- Distributes error to only 2 neighboring pixels
- Fastest Sierra variant
- Lower quality than other Sierra variants
- Good for quick previews

**Best For**: Quick previews, real-time processing, speed-critical applications

---

## Ordered Dithering Algorithms

Ordered dithering uses a threshold matrix (pattern) to determine whether each pixel should be black or white. These algorithms are very fast and produce regular patterns.

### Ordered Dithering

**Type**: Pattern-based threshold

**Description**: Uses a 4x4 threshold map to create a regular dithering pattern. Very fast and predictable.

**Threshold Matrix** (4x4):
```
 0  8  2 10
12  4 14  6
 3 11  1  9
15  7 13  5
```

**Characteristics**:
- Fixed pattern, no random elements
- Very fast processing
- Regular, visible pattern
- Retro aesthetic

**Best For**: Retro effects, pixel art, performance-critical applications

---

### Bayer

**Type**: Ordered dithering variant

**Description**: Uses a Bayer matrix (dispersed-dot ordered dither) for threshold comparison. Creates a more regular pattern than error diffusion.

**Characteristics**:
- Regular dot pattern
- Very fast processing
- Predictable results
- Good for certain artistic effects

**Best For**: Regular patterns, newspaper print effect, retro graphics

---

### Halftone

**Type**: Print-style dithering

**Description**: Simulates traditional print halftone screens with variable-size circular dots. Larger dots appear in darker areas.

**Characteristics**:
- Circular dot patterns
- Emulates traditional print media
- Strong artistic effect
- Clear dot structure

**Best For**: Print-style aesthetic, artistic effects, poster-like images

---

## Modern Techniques

### Blue Noise

**Type**: Stochastic threshold

**Description**: Uses a pre-computed blue noise texture for threshold comparison. Blue noise has even frequency distribution without low-frequency clumping.

**Characteristics**:
- Even distribution without visible patterns
- Film grain-like aesthetic
- No directional bias
- Organic appearance

**Best For**: Film grain effect, organic look, avoiding visible patterns

---

## Algorithm Comparison

| Algorithm | Speed | Quality | Pattern | Best Use Case |
|-----------|-------|---------|---------|---------------|
| Floyd-Steinberg | Medium | High | Minimal | General purpose |
| Atkinson | Medium | Medium-High | Moderate | Retro/Mac aesthetic |
| Stucki | Slow | Very High | Minimal | Smooth photographs |
| Jarvis | Slowest | Highest | Minimal | Professional quality |
| Burkes | Medium-Fast | High | Minimal | Balanced speed/quality |
| Sierra | Slow | Very High | Minimal | Clean results |
| Sierra Two-Row | Medium-Fast | High | Minimal | Fast quality |
| Sierra Lite | Fast | Medium | Moderate | Quick previews |
| Ordered | Very Fast | Low | Regular | Retro effects |
| Bayer | Very Fast | Low-Medium | Regular | Print effects |
| Halftone | Fast | Medium | Circular | Print aesthetic |
| Blue Noise | Fast | Medium-High | Organic | Film grain |

## Choosing an Algorithm

**For photographs**: Floyd-Steinberg, Stucki, or Jarvis
**For speed**: Sierra Lite, Ordered, or Bayer
**For artistic effects**: Atkinson, Halftone, or Blue Noise
**For balanced quality**: Burkes or Sierra Two-Row
**For highest quality**: Jarvis or Stucki
**For retro aesthetic**: Atkinson or Ordered
