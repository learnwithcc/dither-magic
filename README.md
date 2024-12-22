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
Implements four different dithering algorithms:
- Floyd-Steinberg
- Ordered Dithering
- Atkinson
- Bayer

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

## API Documentation

### POST /api/dither
Process an image using specified dithering algorithm.

#### Request
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Image file (PNG, JPEG, GIF, WebP)
  - `algorithm`: String enum
    - `floyd-steinberg`
    - `ordered`
    - `atkinson`
    - `bayer`

#### Response
- Success: PNG image file
- Error: JSON object with error message
  ```json
  {
    "error": "Error description"
  }
  ```

## Image Processing

### Dithering Algorithms Details

#### Floyd-Steinberg
- Error diffusion algorithm
- Error distribution pattern:
  ```
      X   7/16
  3/16 5/16 1/16
  ```

#### Ordered Dithering
- Uses 4x4 threshold map
- Fixed pattern dithering
- Suitable for retro-style effects

#### Atkinson
- Modified error diffusion
- Distributes 1/8 of error to neighbors
- Preserves more contrast

#### Bayer
- Ordered dithering variant
- Uses 4x4 Bayer matrix
- Produces regular pattern

## Development Guidelines

### Code Style
- Python: Follow PEP 8
- JavaScript: ESLint with React plugin
- Use TypeScript types where available

### Git Workflow
1. Feature branches from `main`
2. Pull requests require:
   - No failing tests
   - No ESLint errors
   - No type errors

### Performance Considerations
- Use NumPy for image processing
- Implement client-side image preview
- Batch process multiple algorithms
- Stream large file downloads

### Testing
Backend tests use pytest:
```bash
pytest tests/
```

Frontend tests use Vitest:
```bash
npm test
```

## License
MIT License
