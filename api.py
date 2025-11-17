"""
Public REST API blueprint for programmatic image dithering.

This module provides a public API endpoint at /api/dither for
external applications to process images using the dithering algorithms.
Separate from the main web interface endpoint for clearer API versioning.
"""

from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from PIL import Image
import io
import os
from dithering import floyd_steinberg_dither, ordered_dither, atkinson_dither, bayer_dither

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

    Processes an uploaded image file with the specified dithering algorithm.
    The image is temporarily saved, processed, and then deleted.

    Form Parameters:
        file (FileStorage): The image file to process (PNG, JPEG, GIF, or WebP).
        algorithm (str, optional): The dithering algorithm to use.
            Options: 'floyd-steinberg' (default), 'ordered', 'atkinson', 'bayer'.

    Returns:
        Response: PNG image file with dithered result, or JSON error message.

    Error Codes:
        400: Missing file, invalid file type, or invalid algorithm.
        500: Image processing error.

    Example:
        curl -X POST -F "file=@photo.jpg" -F "algorithm=atkinson" \\
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
        
        try:
            with Image.open(filepath) as img:
                if algorithm == 'floyd-steinberg':
                    dithered = floyd_steinberg_dither(img)
                elif algorithm == 'ordered':
                    dithered = ordered_dither(img)
                elif algorithm == 'atkinson':
                    dithered = atkinson_dither(img)
                elif algorithm == 'bayer':
                    dithered = bayer_dither(img)
                else:
                    return jsonify({'error': 'Invalid algorithm'}), 400

                output = io.BytesIO()
                dithered.save(output, format='PNG')
                output.seek(0)
                os.remove(filepath)
                return send_file(output, mimetype='image/png', as_attachment=True, download_name='dithered.png')
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Invalid file type'}), 400
