import os
from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image, UnidentifiedImageError
import io
from dithering import floyd_steinberg_dither, ordered_dither, atkinson_dither, bayer_dither
from api import api_bp

# Ensure static directory structure exists
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
IMG_DIR = os.path.join(STATIC_DIR, 'img')
ALGORITHMS_DIR = os.path.join(IMG_DIR, 'algorithms')

for directory in [STATIC_DIR, IMG_DIR, ALGORITHMS_DIR]:
    os.makedirs(directory, exist_ok=True)

app = Flask(__name__, static_folder='static')
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max upload size
app.config['UPLOAD_FOLDER'] = '/tmp'
app.register_blueprint(api_bp, url_prefix='/api')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/static/img/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.path.join(app.static_folder, 'img'), filename)

@app.route('/dither', methods=['POST'])
def dither_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    try:
        algorithm = request.form.get('algorithm', 'floyd-steinberg')
        img = Image.open(file.stream).convert('RGB')  # Convert to RGB to ensure compatibility

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