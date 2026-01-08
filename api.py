"""
Public REST API blueprint for programmatic image dithering.

This module provides a public API endpoint at /api/dither for
external applications to process images using the dithering algorithms.
Separate from the main web interface endpoint for clearer API versioning.
"""

import json
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from PIL import Image
import io
import os
from dithering import (
    floyd_steinberg_dither, ordered_dither, atkinson_dither, bayer_dither,
    stucki_dither, jarvis_dither, burkes_dither,
    sierra_dither, sierra_two_row_dither, sierra_lite_dither,
    halftone_dither, blue_noise_dither
)
from palettes import get_palette
from color_dithering import (
    floyd_steinberg_color_dither, ordered_color_dither,
    atkinson_color_dither, bayer_color_dither,
    stucki_color_dither, jarvis_color_dither, burkes_color_dither,
    sierra_color_dither, sierra_two_row_color_dither, sierra_lite_color_dither,
    halftone_color_dither, blue_noise_color_dither
)

# Algorithm mappings for cleaner routing
BW_ALGORITHMS = {
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

COLOR_ALGORITHMS = {
    'floyd-steinberg': floyd_steinberg_color_dither,
    'ordered': ordered_color_dither,
    'atkinson': atkinson_color_dither,
    'bayer': bayer_color_dither,
    'stucki': stucki_color_dither,
    'jarvis': jarvis_color_dither,
    'burkes': burkes_color_dither,
    'sierra': sierra_color_dither,
    'sierra-two-row': sierra_two_row_color_dither,
    'sierra-lite': sierra_lite_color_dither,
    'halftone': halftone_color_dither,
    'blue-noise': blue_noise_color_dither
}

api_bp = Blueprint('api', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    """
    Check if a filename has an allowed extension.

    Args:
        filename (str): The filename to check.

    Returns:
        bool: True if the file extension is in ALLOWED_EXTENSIONS, False otherwise.
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@api_bp.route('/dither', methods=['POST'])
def api_dither_image():
    """
    Public API endpoint for image dithering.

    Processes an uploaded image file with the specified dithering algorithm and color palette.
    The image is temporarily saved, processed, and then deleted.

    Form Parameters:
        file (FileStorage): The image file to process (PNG, JPEG, GIF, or WebP).
        algorithm (str, optional): The dithering algorithm to use.
            Options: 'floyd-steinberg' (default), 'ordered', 'atkinson', 'bayer'.
        palette (str, optional): The color palette to use.
            Options: 'bw' (default), 'gameboy', 'nes', 'c64', 'sepia', 'nord', etc.
        custom_palette (str, optional): JSON string of RGB color arrays for custom palette.
            Example: '[[255,0,0], [0,255,0], [0,0,255]]'

    Returns:
        Response: PNG image file with dithered result, or JSON error message.

    Error Codes:
        400: Missing file, invalid file type, or invalid algorithm.
        500: Image processing error.

    Example:
        curl -X POST -F "file=@photo.jpg" -F "algorithm=atkinson" -F "palette=gameboy" \\
             https://api.example.com/api/dither -o dithered.png
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join('/tmp', filename)
        file.save(filepath)

        algorithm = request.form.get('algorithm', 'floyd-steinberg')
        palette_id = request.form.get('palette', 'bw')
        custom_palette = request.form.get('custom_palette')

        try:
            with Image.open(filepath) as img:
                img = img.convert('RGB')

                # Get palette colors
                if custom_palette:
                    palette = [tuple(c) for c in json.loads(custom_palette)]
                else:
                    palette = get_palette(palette_id)

                # Use color dithering if not B&W palette
                use_color = palette_id != 'bw' or custom_palette

                # Validate algorithm
                if algorithm not in BW_ALGORITHMS:
                    return jsonify({'error': 'Invalid algorithm'}), 400

                if use_color:
                    # Use color dithering functions
                    dither_func = COLOR_ALGORITHMS[algorithm]
                    dithered = dither_func(img, palette)
                else:
                    # Use original B&W functions for backwards compatibility
                    dither_func = BW_ALGORITHMS[algorithm]
                    dithered = dither_func(img)

                output = io.BytesIO()
                dithered.save(output, format='PNG')
                output.seek(0)
                os.remove(filepath)
                return send_file(output, mimetype='image/png', as_attachment=True, download_name='dithered.png')
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Invalid file type'}), 400
