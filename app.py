"""
Flask application for image dithering web interface.

This module serves the React frontend and provides the main dithering
endpoint for the web application. It supports multiple image formats
and dithering algorithms with a 32MB file size limit.
"""

import os
import json
from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image, UnidentifiedImageError
import io
from dithering import (
    floyd_steinberg_dither, ordered_dither, atkinson_dither, bayer_dither,
    stucki_dither, jarvis_dither, burkes_dither,
    sierra_dither, sierra_two_row_dither, sierra_lite_dither,
    halftone_dither, blue_noise_dither
)
from palettes import get_palette, get_palette_list, PALETTES
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
from api import api_bp

app = Flask(__name__, static_folder='static')
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max upload size
app.config['UPLOAD_FOLDER'] = '/tmp'
app.register_blueprint(api_bp, url_prefix='/api')

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

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """
    Serve the React application and static assets.

    This catch-all route serves static files when they exist, otherwise
    returns index.html to enable client-side routing.

    Args:
        path (str): The requested URL path.

    Returns:
        Response: Either the requested static file or index.html.
    """
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/palettes', methods=['GET'])
def list_palettes():
    """
    Return list of available color palettes.

    Returns:
        Response: JSON array of palette objects with id, name, category, and colors.

    Example:
        curl http://localhost:5000/api/palettes
    """
    return jsonify(get_palette_list())

@app.route('/dither', methods=['POST'])
def dither_image():
    """
    Process an uploaded image with the specified dithering algorithm and color palette.

    Accepts multipart/form-data with an image file, algorithm, and palette parameters.
    Supports both B&W (grayscale) and color dithering with various preset or custom palettes.

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
        curl -X POST -F "file=@photo.jpg" -F "algorithm=floyd-steinberg" -F "palette=gameboy" \\
             http://localhost:5000/dither -o output.png
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    try:
        algorithm = request.form.get('algorithm', 'floyd-steinberg')
        palette_id = request.form.get('palette', 'bw')
        custom_palette = request.form.get('custom_palette')

        img = Image.open(file.stream).convert('RGB')  # Convert to RGB to ensure compatibility

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
        return send_file(
            output,
            mimetype='image/png',
            as_attachment=True,
            download_name=f'{algorithm}_{secure_filename(file.filename)}.png'
        )

    except UnidentifiedImageError:
        return jsonify({'error': 'Invalid or corrupted image file'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
