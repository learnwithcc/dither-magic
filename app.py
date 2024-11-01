import os
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
from PIL import Image
import io
from dithering import floyd_steinberg_dither, ordered_dither, atkinson_dither, bayer_dither
from api import api_bp

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
app.config['UPLOAD_FOLDER'] = '/tmp'
app.register_blueprint(api_bp, url_prefix='/api')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dither', methods=['POST'])
def dither_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
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
                return send_file(
                    output,
                    mimetype='image/png',
                    as_attachment=True,
                    download_name=f'{algorithm}_{filename}'
                )
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e)}), 500
        
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
