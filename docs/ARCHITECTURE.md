# Architecture

This document describes the technical architecture of Dither Magic, including backend and frontend components.

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

## Backend Components

### Dithering Algorithms (`dithering.py`)

Implements 12 different dithering algorithms optimized for processing grayscale images using NumPy arrays for efficient computation:

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

### API Routes

**Main Routes** (`app.py`):
- `GET /`: Serves the React application
- `POST /dither`: Processes single images

**API Blueprint** (`api.py`):
- `POST /api/dither`: Public API endpoint for programmatic access
- Supports multiple image formats: PNG, JPEG, GIF, WebP

## Frontend Components

### Core Components

**DitheringPanel**
- Main application interface
- Handles file uploads, processing, and results display
- Manages batch processing and downloads
- Implements image preview with zoom functionality

**Layout**
- Responsive application shell
- Collapsible sidebar
- Mobile-friendly navigation

### UI Components

Custom components built with Radix UI primitives:
- Button
- Card
- Checkbox
- Dialog
- Form elements

## Performance Considerations

- **NumPy Optimization**: Use NumPy for efficient image processing
- **Client-side Preview**: Implement client-side image preview to avoid unnecessary uploads
- **Batch Processing**: Batch process multiple algorithms to reduce overhead
- **Stream Downloads**: Stream large file downloads for better memory usage

## File Organization

```
dither-magic/
├── app.py                 # Main Flask application
├── api.py                 # API blueprint
├── dithering.py          # Dithering algorithms
├── color_dithering.py    # Color dithering support
├── palettes.py           # Color palette definitions
├── src/                  # Frontend source
│   ├── components/       # React components
│   │   ├── DitheringPanel.jsx
│   │   ├── Layout.jsx
│   │   └── ui/          # UI components
│   └── main.jsx         # Entry point
├── static/              # Static assets
├── templates/           # HTML templates
└── docs/               # Documentation
```

## API Flow

1. Client uploads image file via multipart/form-data
2. Flask receives request and validates file type
3. Image is converted to grayscale (PIL)
4. NumPy array is created for efficient processing
5. Selected algorithm is applied
6. Result is converted back to PIL Image
7. PNG is generated and returned to client

## State Management

**Frontend State**
- Algorithm selection persisted to localStorage
- File upload state managed in DitheringPanel
- Processing results stored in component state

**Backend State**
- Stateless API design
- No session management required
- Each request is independent
