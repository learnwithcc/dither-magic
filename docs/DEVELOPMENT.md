# Development Guide

This guide covers setting up your development environment, coding standards, and best practices for contributing to Dither Magic.

## Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- Git
- pip and npm

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/dither-magic.git
cd dither-magic
```

### 2. Install Dependencies

**Python Backend:**
```bash
pip install pillow numpy werkzeug flask pytest
```

**Frontend:**
```bash
npm install
```

### 3. Start Development Servers

You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
python app.py
```
The Flask backend will start on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
The Vite dev server will start on `http://localhost:5173`

### 4. Open the Application

Navigate to `http://localhost:5173` in your browser.

## Development Workflow

### Creating a New Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/` for new features
- `fix/` for bug fixes
- `docs/` for documentation updates
- `refactor/` for code refactoring

### Making Changes

1. Make your changes following the code style guidelines
2. Test your changes thoroughly
3. Update documentation as needed
4. Ensure all tests pass

### Committing Changes

Use clear, descriptive commit messages:

```bash
git commit -m "Add feature: brief description"
```

**Good commit messages:**
- "Add blue noise dithering algorithm"
- "Fix memory leak in batch processing"
- "Update API documentation for new parameters"

**Bad commit messages:**
- "Update"
- "Fix bug"
- "Changes"

### Pushing Changes

```bash
git push origin feature/your-feature-name
```

### Opening a Pull Request

1. Go to GitHub and open a new pull request
2. Provide a clear description of your changes
3. Reference any related issues
4. Add screenshots for UI changes

## Code Style Guidelines

### Python

**Style Guide**: Follow PEP 8

**Key Points:**
- Maximum line length: 100 characters
- Use 4 spaces for indentation (no tabs)
- Use snake_case for functions and variables
- Use PascalCase for classes
- Add docstrings to all functions

**Example:**

```python
def process_image(image: Image.Image, threshold: int = 127) -> Image.Image:
    """
    Process an image with a threshold.

    Args:
        image: Input PIL Image object
        threshold: Threshold value for processing (default: 127)

    Returns:
        Processed PIL Image object

    Example:
        >>> img = Image.open('photo.jpg')
        >>> result = process_image(img, threshold=128)
    """
    # Convert to grayscale
    img = image.convert('L')

    # Apply processing
    arr = np.array(img)
    arr = (arr > threshold) * 255

    return Image.fromarray(arr.astype(np.uint8))
```

### JavaScript/React

**Style Guide**: ESLint with React plugin

**Key Points:**
- Maximum line length: 100 characters
- Use 2 spaces for indentation
- Use camelCase for functions and variables
- Use PascalCase for components
- Prefer const over let, never use var
- Use arrow functions
- Use functional components with hooks

**Example:**

```javascript
/**
 * Processes multiple images in parallel.
 *
 * @param {File[]} files - Array of image files to process
 * @param {string[]} algorithms - Array of algorithm names to apply
 * @returns {Promise<Object[]>} Array of processing results
 */
const processImages = async (files, algorithms) => {
  const results = [];

  for (const file of files) {
    for (const algo of algorithms) {
      try {
        const result = await processImage(file, algo);
        results.push({ success: true, file: file.name, algorithm: algo, result });
      } catch (error) {
        results.push({ success: false, file: file.name, algorithm: algo, error });
      }
    }
  }

  return results;
};
```

### Imports

**Python:**
```python
# Standard library
import os
from pathlib import Path

# Third-party
import numpy as np
from PIL import Image
from flask import Flask, request

# Local
from dithering import floyd_steinberg_dither
from palettes import get_palette
```

**JavaScript:**
```javascript
// React and third-party
import { useState, useEffect } from 'react';
import { Download, Upload } from 'lucide-react';

// Local components
import { Button } from './ui/button';
import { Card } from './ui/card';

// Utilities
import { cn } from '../lib/utils';
```

## Testing

### Backend Tests

**Running Tests:**
```bash
pytest tests/
```

**Running Specific Tests:**
```bash
pytest tests/test_dithering.py
pytest tests/test_api.py -k test_floyd_steinberg
```

**Writing Tests:**

```python
import pytest
from PIL import Image
import numpy as np
from dithering import floyd_steinberg_dither

def test_floyd_steinberg_output():
    """Test that Floyd-Steinberg produces valid binary output."""
    # Create test image
    img = Image.new('RGB', (100, 100), color='gray')

    # Apply dithering
    result = floyd_steinberg_dither(img)

    # Verify output
    assert result.mode == 'L'
    assert result.size == (100, 100)

    # Check that output is binary (only 0 and 255)
    arr = np.array(result)
    unique_values = np.unique(arr)
    assert set(unique_values) <= {0, 255}

def test_api_endpoint():
    """Test API endpoint returns correct response."""
    # Test implementation
    pass
```

### Frontend Tests

**Running Tests:**
```bash
npm test
```

**Writing Tests:**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { DitheringPanel } from './DitheringPanel';

describe('DitheringPanel', () => {
  test('renders upload button', () => {
    render(<DitheringPanel />);
    const uploadButton = screen.getByText(/upload/i);
    expect(uploadButton).toBeInTheDocument();
  });

  test('allows algorithm selection', () => {
    render(<DitheringPanel />);
    const checkbox = screen.getByLabelText(/floyd-steinberg/i);
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
```

## Building for Production

### Frontend Build

```bash
npm run build
```

This creates optimized static files in the `static/` directory.

### Production Deployment

1. Build the frontend
2. Set environment variables:
   ```bash
   export FLASK_ENV=production
   ```
3. Run with a production WSGI server:
   ```bash
   gunicorn app:app
   ```

## Common Development Tasks

### Adding a New Algorithm

See the [CONTRIBUTING.md](../CONTRIBUTING.md) guide for detailed instructions on adding new dithering algorithms.

### Adding a New UI Component

1. Create component in `src/components/ui/`
2. Follow Radix UI patterns for accessibility
3. Use Tailwind for styling
4. Export from component file

### Updating API Endpoints

1. Add route in `api.py`
2. Update API documentation
3. Add tests for new endpoint
4. Update frontend to use new endpoint

### Debugging

**Backend:**
```python
# Enable Flask debug mode
app.run(debug=True)

# Add print statements or use pdb
import pdb; pdb.set_trace()
```

**Frontend:**
```javascript
// Use React DevTools browser extension
// Add console.log for debugging
console.log('Processing file:', file.name);

// Use debugger statement
debugger;
```

## Performance Optimization

### Backend

- Use NumPy for array operations (much faster than Python loops)
- Profile with cProfile for bottlenecks
- Consider caching for repeated operations
- Use appropriate image formats (PNG for output)

### Frontend

- Lazy load components with React.lazy()
- Debounce expensive operations
- Use Web Workers for heavy processing
- Optimize bundle size with code splitting

## Environment Variables

Create a `.env` file for local development:

```bash
FLASK_ENV=development
FLASK_DEBUG=1
MAX_CONTENT_LENGTH=33554432  # 32MB
```

## Port Configuration

**Default Ports:**
- Flask backend: 5000
- Vite frontend: 5173

**Changing Ports:**

Backend (`app.py`):
```python
app.run(port=5001)
```

Frontend (`vite.config.js`):
```javascript
export default {
  server: {
    port: 3000
  }
}
```

## Common Issues

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for solutions to common development issues.

## Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [NumPy Documentation](https://numpy.org/doc/)
- [Pillow Documentation](https://pillow.readthedocs.io/)
