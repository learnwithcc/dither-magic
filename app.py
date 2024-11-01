import os
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
from PIL import Image, UnidentifiedImageError
import io
from dithering import floyd_steinberg_dither, ordered_dither, atkinson_dither, bayer_dither
from api import api_bp

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max upload size
app.config['UPLOAD_FOLDER'] = '/tmp'
app.register_blueprint(api_bp, url_prefix='/api')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

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
        try:
            # Read file into memory first to avoid file system issues
            file_content = file.read()
            input_image = Image.open(io.BytesIO(file_content))
            
            # Convert RGBA to RGB if necessary
            if input_image.mode == 'RGBA':
                background = Image.new('RGB', input_image.size, (255, 255, 255))
                background.paste(input_image, mask=input_image.split()[3])
                input_image = background
            elif input_image.mode not in ['RGB', 'L']:
                input_image = input_image.convert('RGB')

            algorithm = request.form.get('algorithm', 'floyd-steinberg')
            
            try:
                if algorithm == 'floyd-steinberg':
                    dithered = floyd_steinberg_dither(input_image)
                elif algorithm == 'ordered':
                    dithered = ordered_dither(input_image)
                elif algorithm == 'atkinson':
                    dithered = atkinson_dither(input_image)
                elif algorithm == 'bayer':
                    dithered = bayer_dither(input_image)
                else:
                    return jsonify({'error': 'Invalid algorithm'}), 400

                output = io.BytesIO()
                dithered.save(output, format='PNG', optimize=True)
                output.seek(0)
                
                return send_file(
                    output,
                    mimetype='image/png',
                    as_attachment=True,
                    download_name=f'{algorithm}_{secure_filename(file.filename)}.png'
                )
                
            except Exception as e:
                return jsonify({'error': f'Error processing image with {algorithm}: {str(e)}'}), 500
                
        except UnidentifiedImageError:
            return jsonify({'error': 'Cannot identify image file'}), 400
        except Exception as e:
            return jsonify({'error': f'Error opening image: {str(e)}'}), 500
        
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
