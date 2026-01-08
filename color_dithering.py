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


def stucki_color_dither(image, palette):
    """
    Apply Stucki error diffusion dithering with a color palette.

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

    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def jarvis_color_dither(image, palette):
    """
    Apply Jarvis-Judice-Ninke error diffusion dithering with a color palette.

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

    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def burkes_color_dither(image, palette):
    """
    Apply Burkes error diffusion dithering with a color palette.

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

    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def sierra_color_dither(image, palette):
    """
    Apply Sierra (3-row) error diffusion dithering with a color palette.

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

    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def sierra_two_row_color_dither(image, palette):
    """
    Apply Sierra Two-Row error diffusion dithering with a color palette.

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

    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def sierra_lite_color_dither(image, palette):
    """
    Apply Sierra Lite error diffusion dithering with a color palette.

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
                arr[y, x + 1] += error * 2 / 4
            if y + 1 < h:
                if x - 1 >= 0:
                    arr[y + 1, x - 1] += error * 1 / 4
                arr[y + 1, x] += error * 1 / 4

    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def halftone_color_dither(image, palette, dot_size=4):
    """
    Apply halftone dithering with a color palette.

    Args:
        image (PIL.Image): Input RGB image
        palette (list): List of RGB tuples representing available colors
        dot_size (int): Size of halftone cells in pixels (default: 4).

    Returns:
        PIL.Image: Halftone dithered image using palette colors
    """
    img = image.convert('RGB')
    arr = np.array(img, dtype=float)
    h, w, _ = arr.shape

    # Sort palette by luminance
    palette_sorted = sorted(palette, key=lambda c: 0.299*c[0] + 0.587*c[1] + 0.114*c[2])
    n_colors = len(palette_sorted)

    # Create coordinate grids for circle calculations
    y_coords, x_coords = np.ogrid[:dot_size, :dot_size]
    center = dot_size / 2

    # Initialize output with lightest color
    output = np.full((h, w, 3), palette_sorted[-1], dtype=np.uint8)

    for y in range(0, h - dot_size + 1, dot_size):
        for x in range(0, w - dot_size + 1, dot_size):
            # Calculate average color in this cell
            cell = arr[y:y + dot_size, x:x + dot_size]
            avg_color = np.mean(cell, axis=(0, 1))
            avg_luminance = (0.299 * avg_color[0] + 0.587 * avg_color[1] + 0.114 * avg_color[2]) / 255

            # Calculate dot radius based on luminance (darker = larger)
            max_radius = dot_size / 2
            radius = max_radius * (1 - avg_luminance)

            # Find closest dark color for the dot
            dark_idx = int(np.clip((1 - avg_luminance) * n_colors, 0, n_colors - 1))
            dot_color = palette_sorted[dark_idx]

            # Create circular mask
            distance = np.sqrt((x_coords - center + 0.5) ** 2 +
                             (y_coords - center + 0.5) ** 2)
            mask = distance <= radius

            # Apply dot
            for c in range(3):
                output[y:y + dot_size, x:x + dot_size, c][mask] = dot_color[c]

    return Image.fromarray(output)


def blue_noise_color_dither(image, palette):
    """
    Apply blue noise dithering with a color palette.

    Args:
        image (PIL.Image): Input RGB image
        palette (list): List of RGB tuples representing available colors

    Returns:
        PIL.Image: Blue noise dithered image using palette colors
    """
    from scipy.ndimage import gaussian_filter

    img = image.convert('RGB')
    arr = np.array(img, dtype=float)
    h, w, _ = arr.shape

    # Sort palette by luminance
    palette_sorted = sorted(palette, key=lambda c: 0.299*c[0] + 0.587*c[1] + 0.114*c[2])
    n_colors = len(palette_sorted)

    # Generate blue noise map
    np.random.seed(42)
    noise = np.random.rand(64, 64)
    noise = gaussian_filter(noise, sigma=1.5)
    noise = (noise - noise.min()) / (noise.max() - noise.min())

    noise_h, noise_w = noise.shape
    output = np.zeros((h, w, 3), dtype=np.uint8)

    for y in range(h):
        for x in range(w):
            pixel = arr[y, x]
            luminance = (0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2]) / 255
            threshold = noise[y % noise_h, x % noise_w]

            # Adjust luminance by threshold and map to palette index
            adjusted = luminance + (threshold - 0.5) / n_colors
            palette_idx = int(np.clip(adjusted * n_colors, 0, n_colors - 1))
            output[y, x] = palette_sorted[palette_idx]

    return Image.fromarray(output)
