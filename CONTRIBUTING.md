# Contributing to Dither Magic

Thank you for your interest in contributing to Dither Magic! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Adding New Dithering Algorithms](#adding-new-dithering-algorithms)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- Git

### Setup Development Environment

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dither-magic.git
   cd dither-magic
   ```

2. Install Python dependencies:
   ```bash
   pip install pillow numpy werkzeug flask pytest
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Start the development servers:
   ```bash
   # Terminal 1: Start Flask backend
   python app.py

   # Terminal 2: Start Vite dev server
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the code style guidelines

3. Test your changes thoroughly

4. Commit your changes with clear, descriptive messages:
   ```bash
   git commit -m "Add feature: brief description"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Open a pull request with a clear description of your changes

## Adding New Dithering Algorithms

To add a new dithering algorithm, follow these steps:

### 1. Implement the Algorithm

Add your algorithm function to `dithering.py`:

```python
def your_algorithm_dither(image):
    """
    Apply your algorithm dithering to an image.

    Provide a clear description of the algorithm, its characteristics,
    and any relevant historical context or use cases.

    Args:
        image (PIL.Image): Input image to be dithered. Will be converted to grayscale.

    Returns:
        PIL.Image: Dithered black and white image (grayscale mode).

    Example:
        >>> from PIL import Image
        >>> img = Image.open('photo.jpg')
        >>> dithered = your_algorithm_dither(img)
        >>> dithered.save('output.png')
    """
    img = image.convert('L')
    arr = np.array(img, dtype=float)
    h, w = arr.shape

    # Your algorithm implementation here

    return Image.fromarray(arr.astype(np.uint8))
```

### 2. Update Backend Routes

Add your algorithm to both `app.py` and `api.py`:

```python
# Import the function
from dithering import your_algorithm_dither

# Add to the route handlers
elif algorithm == 'your-algorithm':
    dithered = your_algorithm_dither(img)
```

### 3. Update Frontend

Add the algorithm to the frontend in `src/components/DitheringPanel.jsx`:

1. Add an algorithm icon (SVG) to `static/img/algorithms/your-algorithm.svg`

2. Update the `algorithmIcons` object:
   ```javascript
   const algorithmIcons = {
     // ... existing algorithms
     'your-algorithm': '/static/img/algorithms/your-algorithm.svg'
   };
   ```

3. Update the initial state to include your algorithm:
   ```javascript
   const [selectedAlgorithms, setSelectedAlgorithms] = useState(() => {
     const saved = localStorage.getItem('selectedAlgorithms');
     return saved ? JSON.parse(saved) : {
       'floyd-steinberg': true,
       'ordered': false,
       'atkinson': false,
       'bayer': false,
       'your-algorithm': false  // Add this line
     };
   });
   ```

4. Add the checkbox in the JSX section (around line 350):
   ```jsx
   <div className="flex items-center space-x-3 p-2">
     <Checkbox
       id="your-algorithm"
       checked={selectedAlgorithms['your-algorithm']}
       onCheckedChange={(checked) =>
         handleAlgorithmChange('your-algorithm', checked)
       }
     />
     <label htmlFor="your-algorithm" className="flex items-center gap-2">
       <img
         src={algorithmIcons['your-algorithm']}
         alt="Your Algorithm"
         className="w-6 h-6"
       />
       <span>Your Algorithm Name</span>
     </label>
   </div>
   ```

### 4. Update Documentation

1. Add algorithm description to README.md:
   ```markdown
   #### Your Algorithm
   - Brief description
   - Key characteristics
   - Use cases
   ```

2. Update API_EXAMPLES.md with examples using your algorithm

## Code Style Guidelines

### Python

- Follow PEP 8 style guide
- Use meaningful variable names
- Add docstrings to all functions using Google-style format
- Maximum line length: 100 characters
- Use type hints where beneficial

Example:
```python
def process_image(image: Image.Image, threshold: int = 127) -> Image.Image:
    """
    Process an image with a threshold.

    Args:
        image: Input PIL Image object
        threshold: Threshold value for processing (default: 127)

    Returns:
        Processed PIL Image object
    """
    # Implementation
    pass
```

### JavaScript/React

- Use functional components with hooks
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Use const/let (never var)
- Prefer arrow functions
- Maximum line length: 100 characters

Example:
```javascript
/**
 * Processes multiple images in parallel.
 *
 * @param {File[]} files - Array of image files to process
 * @param {string[]} algorithms - Array of algorithm names to apply
 * @returns {Promise<Object[]>} Array of processing results
 */
const processImages = async (files, algorithms) => {
  // Implementation
};
```

### File Organization

- Keep files focused on a single responsibility
- Group related functionality together
- Use descriptive file names
- Organize imports: external libraries first, then local modules

## Testing

### Backend Tests

We use pytest for backend testing. Run tests with:

```bash
pytest tests/
```

When adding new algorithms, include tests for:
- Correct output format
- Handling various image sizes
- Error handling for invalid inputs

Example test:
```python
def test_your_algorithm_dither():
    """Test your algorithm produces valid output."""
    img = Image.new('RGB', (100, 100), color='gray')
    result = your_algorithm_dither(img)

    assert result.mode == 'L'
    assert result.size == (100, 100)
    assert set(np.unique(np.array(result))) <= {0, 255}
```

### Frontend Tests

We use Vitest for frontend testing. Run tests with:

```bash
npm test
```

## Submitting Changes

### Pull Request Guidelines

1. **Title**: Use a clear, descriptive title
   - Good: "Add Jarvis-Judice-Ninke dithering algorithm"
   - Bad: "New algorithm"

2. **Description**: Include:
   - What changes were made
   - Why the changes were needed
   - Any breaking changes
   - Screenshots for UI changes

3. **Before Submitting**:
   - Ensure all tests pass
   - Check code style compliance
   - Update documentation as needed
   - Test manually in both development and production builds

4. **Commit Messages**:
   - Use present tense ("Add feature" not "Added feature")
   - Be descriptive but concise
   - Reference issues when applicable (#123)

### Code Review Process

1. A maintainer will review your PR within a few days
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge your PR

## Questions?

If you have questions or need help:

- Open an issue on GitHub
- Check existing issues and discussions
- Review the README.md for basic documentation

## License

By contributing to Dither Magic, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Dither Magic!
