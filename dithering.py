"""
Image dithering algorithms implementation.

This module provides four different dithering algorithms for converting
grayscale images to black and white using various error diffusion and
threshold-based techniques.
"""

import numpy as np
from PIL import Image

def floyd_steinberg_dither(image):
    """
    Apply Floyd-Steinberg error diffusion dithering to an image.

    Floyd-Steinberg is an error diffusion algorithm that distributes
    quantization error to neighboring pixels using the following pattern:

            X     7/16
        3/16  5/16  1/16

    Where X is the current pixel being processed.

    Args:
        image (PIL.Image): Input image to be dithered. Will be converted to grayscale.

    Returns:
        PIL.Image: Dithered black and white image (grayscale mode).

    Example:
        >>> from PIL import Image
        >>> img = Image.open('photo.jpg')
        >>> dithered = floyd_steinberg_dither(img)
        >>> dithered.save('output.png')
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
                arr[y, x + 1] += error * 7 / 16
            if y + 1 < h:
                if x > 0:
                    arr[y + 1, x - 1] += error * 3 / 16
                arr[y + 1, x] += error * 5 / 16
                if x + 1 < w:
                    arr[y + 1, x + 1] += error * 1 / 16

    return Image.fromarray(arr.astype(np.uint8))

def ordered_dither(image):
    """
    Apply ordered (patterned) dithering using a 4x4 threshold map.

    Ordered dithering uses a fixed threshold matrix to determine whether
    each pixel should be black or white. This creates a consistent,
    pattern-based dithering effect suitable for retro-style graphics.

    The threshold map values range from 0-240 in steps of 16, creating
    a regular pattern across the image.

    Args:
        image (PIL.Image): Input image to be dithered. Will be converted to grayscale.

    Returns:
        PIL.Image: Dithered black and white image (grayscale mode).

    Example:
        >>> from PIL import Image
        >>> img = Image.open('photo.jpg')
        >>> dithered = ordered_dither(img)
        >>> dithered.save('output.png')
    """
    img = image.convert('L')
    arr = np.array(img)
    h, w = arr.shape

    threshold_map = np.array([
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
    ]) * 16

    for y in range(h):
        for x in range(w):
            threshold = threshold_map[y % 4, x % 4]
            arr[y, x] = 255 if arr[y, x] > threshold else 0

    return Image.fromarray(arr)

def atkinson_dither(image):
    """
    Apply Atkinson dithering algorithm to an image.

    Atkinson dithering is a modified error diffusion algorithm developed
    by Bill Atkinson for the original Macintosh. It distributes only 6/8
    (75%) of the quantization error to neighboring pixels, creating images
    with better contrast preservation and slightly brighter appearance.

    Error distribution pattern:
            X   1/8  1/8
        1/8 1/8  1/8
            1/8

    Where X is the current pixel (2/8 of error is discarded).

    Args:
        image (PIL.Image): Input image to be dithered. Will be converted to grayscale.

    Returns:
        PIL.Image: Dithered black and white image (grayscale mode).

    Example:
        >>> from PIL import Image
        >>> img = Image.open('photo.jpg')
        >>> dithered = atkinson_dither(img)
        >>> dithered.save('output.png')
    """
    img = image.convert('L')
    arr = np.array(img, dtype=float)
    h, w = arr.shape

    for y in range(h):
        for x in range(w):
            old_pixel = arr[y, x]
            new_pixel = 255 if old_pixel > 127 else 0
            arr[y, x] = new_pixel
            error = (old_pixel - new_pixel) / 8

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

    return Image.fromarray(arr.astype(np.uint8))

def bayer_dither(image):
    """
    Apply Bayer matrix ordered dithering to an image.

    Bayer dithering uses a normalized 4x4 Bayer matrix for threshold
    comparison. This is a variant of ordered dithering that produces
    a regular, dispersed dot pattern. The Bayer matrix values are
    normalized to the range [0, 1] for comparison with pixel intensities.

    Args:
        image (PIL.Image): Input image to be dithered. Will be converted to grayscale.

    Returns:
        PIL.Image: Dithered black and white image (grayscale mode).

    Example:
        >>> from PIL import Image
        >>> img = Image.open('photo.jpg')
        >>> dithered = bayer_dither(img)
        >>> dithered.save('output.png')
    """
    img = image.convert('L')
    arr = np.array(img)
    h, w = arr.shape

    bayer_matrix = np.array([
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
    ]) / 16

    for y in range(h):
        for x in range(w):
            threshold = bayer_matrix[y % 4, x % 4]
            arr[y, x] = 255 if arr[y, x] / 255 > threshold else 0

    return Image.fromarray(arr)


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


def generate_blue_noise(size=64):
    """
    Generate a blue noise threshold map using a simplified algorithm.

    This is a simplified implementation using random noise with Gaussian
    filtering to approximate blue noise characteristics.

    Args:
        size (int): Size of the blue noise texture (size x size).

    Returns:
        np.ndarray: Blue noise threshold map normalized to [0, 1].
    """
    from scipy.ndimage import gaussian_filter

    np.random.seed(42)  # Reproducible
    noise = np.random.rand(size, size)

    # Apply Gaussian blur and normalize to spread values
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
