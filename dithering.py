import numpy as np
from PIL import Image

def floyd_steinberg_dither(image):
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
