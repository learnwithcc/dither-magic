# Image Dithering App

A single-page application for image dithering with multiple algorithms and a public API. Built with Flask and React.

## Tech Stack

### Backend
- **Flask**: Web framework for the REST API
- **Pillow**: Image processing library
- **NumPy**: Numerical computing for dithering algorithms
- **Werkzeug**: WSGI utility library for Python

### Frontend
- **React**: UI framework
- **Vite**: Build tool and development server
- **TailwindCSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **JSZip**: Client-side ZIP file generation

## Architecture

### Backend Components

#### Dithering Algorithms (`dithering.py`)
Implements 12 different dithering algorithms:

**Error Diffusion (Classic)**
- Floyd-Steinberg
- Atkinson

**Error Diffusion (Extended)**
- Stucki
- Jarvis-Judice-Ninke
- Burkes

**Sierra Family**
- Sierra (3-Row)
- Sierra Two-Row
- Sierra Lite

**Ordered/Pattern**
- Ordered Dithering
- Bayer
- Halftone

**Modern**
- Blue Noise

Each algorithm is optimized for processing grayscale images using NumPy arrays for efficient computation.

#### API Routes
- **Main Routes** (`app.py`):
  - `GET /`: Serves the React application
  - `POST /dither`: Processes single images
  
- **API Blueprint** (`api.py`):
  - `POST /api/dither`: Public API endpoint for programmatic access
  - Supports multiple image formats: PNG, JPEG, GIF, WebP

### Frontend Components

#### Core Components
- **DitheringPanel**: Main application interface
  - Handles file uploads, processing, and results display
  - Manages batch processing and downloads
  - Implements image preview with zoom functionality

- **Layout**: Responsive application shell
  - Collapsible sidebar
  - Mobile-friendly navigation

#### UI Components
Custom components built with Radix UI primitives:
- Button
- Card
- Checkbox
- Dialog
- Form elements

## Quick Start

### Web Interface

Visit the deployed application or run locally (see Development Setup below) to:
1. Upload one or more images (drag-and-drop or click to browse)
2. Select dithering algorithms (12 algorithms available including Floyd-Steinberg, Atkinson, Stucki, Jarvis, Sierra family, Halftone, Blue Noise, and more)
3. Click "Process Images" to dither your images
4. Download individual results or all results as a ZIP file

### API Usage

Process images programmatically using the REST API:

```bash
# Floyd-Steinberg dithering
curl -X POST \
  -F "file=@photo.jpg" \
  -F "algorithm=floyd-steinberg" \
  http://localhost:5000/api/dither \
  -o dithered.png
```

See [API_EXAMPLES.md](API_EXAMPLES.md) for comprehensive examples in Python, JavaScript, and more.

## Development Setup

### Prerequisites
```bash
# Install Python dependencies
pip install pillow numpy werkzeug flask

# Install Node.js dependencies
npm install
```

### Development Server
1. Start Flask backend:
```bash
python app.py
```

2. Start Vite development server:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

## API Documentation

### POST /api/dither
Process an image using specified dithering algorithm.

#### Request
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Image file (PNG, JPEG, GIF, WebP)
  - `algorithm`: String enum (optional, default: `floyd-steinberg`)
    - `floyd-steinberg` - Classic error diffusion
    - `ordered` - 4x4 threshold pattern
    - `atkinson` - Mac classic style
    - `bayer` - Regular dot pattern
    - `stucki` - Smooth gradients
    - `jarvis` - High detail preservation
    - `burkes` - Balanced quality/speed
    - `sierra` - Minimal artifacts
    - `sierra-two-row` - Faster Sierra variant
    - `sierra-lite` - Fastest Sierra
    - `halftone` - Print-style dots
    - `blue-noise` - Film grain aesthetic

#### Response
- Success (200): PNG image file
- Error (400/500): JSON object with error message
  ```json
  {
    "error": "Error description"
  }
  ```

#### Example
```bash
curl -X POST \
  -F "file=@image.jpg" \
  -F "algorithm=atkinson" \
  http://localhost:5000/api/dither \
  -o output.png
```

For more examples and client libraries, see [API_EXAMPLES.md](API_EXAMPLES.md).

## Image Processing

### Dithering Algorithms Details

#### Error Diffusion Algorithms

**Floyd-Steinberg**
- Classic error diffusion algorithm
- Error distribution: 7/16, 3/16, 5/16, 1/16
- Good for general use

**Atkinson**
- Modified error diffusion (Mac classic style)
- Distributes 6/8 of error (discards 2/8)
- Preserves more contrast, brighter appearance

**Stucki**
- 3-row extended kernel
- Smoother gradients, less visible patterns
- Excellent for photographs

**Jarvis-Judice-Ninke**
- Large 3-row kernel optimized for photos
- High-quality with excellent detail preservation
- Best for detailed images

**Burkes**
- Simplified 2-row kernel
- Good balance between speed and quality
- Faster than Stucki/Jarvis

**Sierra (3-Row)**
- Full 3-row kernel
- Excellent quality with minimal artifacts
- Good for high-contrast images

**Sierra Two-Row**
- Simplified 2-row version
- Faster while maintaining good quality

**Sierra Lite**
- Minimal 3-pixel kernel
- Fastest Sierra variant
- Good for quick previews

#### Ordered Dithering Algorithms

**Ordered Dithering**
- Uses 4x4 threshold map
- Fixed pattern dithering
- Suitable for retro-style effects

**Bayer**
- Ordered dithering variant
- Uses 4x4 Bayer matrix
- Produces regular pattern

**Halftone**
- Classic print-style circular dots
- Larger dots in dark areas
- Artistic/print aesthetic

#### Modern Techniques

**Blue Noise**
- Stochastic threshold texture
- Even distribution without visible patterns
- Film grain-like aesthetic

## Features

- **12 Dithering Algorithms**: Floyd-Steinberg, Atkinson, Stucki, Jarvis, Burkes, Sierra family (3 variants), Ordered, Bayer, Halftone, and Blue Noise
- **Batch Processing**: Process multiple images with multiple algorithms simultaneously
- **Drag-and-Drop Upload**: Easy file upload with drag-and-drop support
- **Image Preview**: Zoom and navigate through input and output images
- **Bulk Download**: Download all results as a ZIP file
- **Algorithm Persistence**: Your algorithm selection is saved in localStorage
- **REST API**: Programmatic access for automation and integration
- **Responsive Design**: Works on desktop and mobile devices

## Performance & Limits

- **Maximum File Size**: 32MB per image
- **Supported Formats**: PNG, JPEG, GIF, WebP
- **Processing Time**: Varies by image size and algorithm
  - Small images (< 1MB): ~1-2 seconds
  - Medium images (1-5MB): ~3-10 seconds
  - Large images (5-32MB): ~10-60 seconds
- **Recommended Image Size**: Under 5MB for best performance

## Troubleshooting

### Common Issues

**Issue**: "No file part" error
- **Solution**: Ensure you're sending the file with the correct field name (`file`)

**Issue**: "Invalid file type" error
- **Solution**: Only PNG, JPEG, GIF, and WebP formats are supported. Convert your image first.

**Issue**: "Request entity too large" error
- **Solution**: Image exceeds 32MB limit. Resize or compress the image before uploading.

**Issue**: Processing takes a long time
- **Solution**: Large images (>5MB) can take 30+ seconds. Consider resizing if you don't need high resolution.

**Issue**: Output image appears too dark/bright
- **Solution**: Different algorithms produce different results. Try different algorithms to find the best result for your image.

**Issue**: CORS errors when using the API
- **Solution**: The API currently doesn't have CORS enabled. For cross-origin requests, configure CORS in `app.py` or use a proxy.

### Development Issues

**Issue**: Port 5000 already in use
- **Solution**: Kill the process using port 5000 or change the port in `app.py`
  ```bash
  # Find and kill process on port 5000
  lsof -ti:5000 | xargs kill -9
  ```

**Issue**: Module not found errors
- **Solution**: Ensure all dependencies are installed
  ```bash
  pip install pillow numpy werkzeug flask
  npm install
  ```

**Issue**: Vite dev server not connecting to Flask backend
- **Solution**: Check that Flask is running on port 5000 and Vite proxy is configured in `vite.config.js`

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- How to set up your development environment
- How to add new dithering algorithms
- Code style guidelines
- How to submit pull requests

## Development Guidelines

### Code Style
- Python: Follow PEP 8 with docstrings for all functions
- JavaScript: Use ESLint with React plugin
- Maximum line length: 100 characters

### Git Workflow
1. Create feature branches from `main`
2. Write clear, descriptive commit messages
3. Ensure code is documented before submitting PRs

### Performance Considerations
- Use NumPy for efficient image processing
- Implement client-side image preview to avoid unnecessary uploads
- Batch process multiple algorithms to reduce overhead
- Stream large file downloads

## Additional Resources

- [API_EXAMPLES.md](API_EXAMPLES.md) - Comprehensive API usage examples
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [Dithering Algorithms](https://en.wikipedia.org/wiki/Dither) - Learn more about dithering

## License
MIT License
