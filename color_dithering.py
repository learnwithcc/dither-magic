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
