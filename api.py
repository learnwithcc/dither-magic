from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from PIL import Image
import io
import os
from dithering import floyd_steinberg_dither, ordered_dither, atkinson_dither, bayer_dither

api_bp = Blueprint('api', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@api_bp.route('/dither', methods=['POST'])
def api_dither_image():
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
