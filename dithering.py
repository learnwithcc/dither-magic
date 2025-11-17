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
