# API Usage Examples

This document provides practical examples for using the Dither Magic API programmatically.

## Table of Contents

- [Quick Start](#quick-start)
- [cURL Examples](#curl-examples)
- [Python Examples](#python-examples)
- [JavaScript Examples](#javascript-examples)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Quick Start

The API endpoint is available at:
```
POST /api/dither
```

**Base URL**: `http://localhost:5000` (development) or your deployment URL

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (required): Image file to process
- `algorithm` (optional): Dithering algorithm (default: `floyd-steinberg`)
  - Options: `floyd-steinberg`, `ordered`, `atkinson`, `bayer`

## cURL Examples

### Basic Usage (Floyd-Steinberg)

```bash
curl -X POST \
  -F "file=@path/to/your/image.jpg" \
  http://localhost:5000/api/dither \
  -o output.png
```

### Specify Algorithm

```bash
# Atkinson dithering
curl -X POST \
  -F "file=@photo.jpg" \
  -F "algorithm=atkinson" \
  http://localhost:5000/api/dither \
  -o atkinson_output.png
```

### Process Multiple Images

```bash
# Process the same image with all algorithms
for algo in floyd-steinberg ordered atkinson bayer; do
  curl -X POST \
    -F "file=@input.jpg" \
    -F "algorithm=$algo" \
    http://localhost:5000/api/dither \
    -o "${algo}_output.png"
  echo "Processed with $algo"
done
```

### With Error Handling

```bash
curl -X POST \
  -F "file=@image.jpg" \
  -F "algorithm=floyd-steinberg" \
  http://localhost:5000/api/dither \
  -o output.png \
  --fail-with-body \
  -w "\nHTTP Status: %{http_code}\n"
```

## Python Examples

### Basic Example with requests

```python
import requests

def dither_image(image_path, algorithm='floyd-steinberg', output_path='output.png'):
    """
    Dither an image using the Dither Magic API.

    Args:
        image_path: Path to the input image
        algorithm: Dithering algorithm to use
        output_path: Path to save the dithered image

    Returns:
        bool: True if successful, False otherwise
    """
    url = 'http://localhost:5000/api/dither'

    with open(image_path, 'rb') as f:
        files = {'file': f}
        data = {'algorithm': algorithm}

        response = requests.post(url, files=files, data=data)

    if response.status_code == 200:
        with open(output_path, 'wb') as f:
            f.write(response.content)
        print(f"Image saved to {output_path}")
        return True
    else:
        print(f"Error: {response.json().get('error', 'Unknown error')}")
        return False

# Usage
dither_image('photo.jpg', algorithm='atkinson', output_path='dithered.png')
```

### Batch Processing

```python
import requests
from pathlib import Path

def batch_dither(input_dir, output_dir, algorithms=None):
    """
    Process all images in a directory with specified algorithms.

    Args:
        input_dir: Directory containing input images
        output_dir: Directory to save processed images
        algorithms: List of algorithms to use (default: all)
    """
    if algorithms is None:
        algorithms = ['floyd-steinberg', 'ordered', 'atkinson', 'bayer']

    url = 'http://localhost:5000/api/dither'
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Supported image extensions
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

    for image_file in input_path.iterdir():
        if image_file.suffix.lower() not in image_extensions:
            continue

        print(f"Processing {image_file.name}...")

        for algo in algorithms:
            with open(image_file, 'rb') as f:
                files = {'file': f}
                data = {'algorithm': algo}

                response = requests.post(url, files=files, data=data)

            if response.status_code == 200:
                output_file = output_path / f"{image_file.stem}_{algo}.png"
                with open(output_file, 'wb') as f:
                    f.write(response.content)
                print(f"  ✓ {algo}: {output_file.name}")
            else:
                error = response.json().get('error', 'Unknown error')
                print(f"  ✗ {algo}: {error}")

# Usage
batch_dither('input_images/', 'output_images/', algorithms=['floyd-steinberg', 'atkinson'])
```

### Using PIL for In-Memory Processing

```python
import requests
from PIL import Image
from io import BytesIO

def dither_pil_image(pil_image, algorithm='floyd-steinberg'):
    """
    Dither a PIL Image object using the API.

    Args:
        pil_image: PIL Image object
        algorithm: Dithering algorithm to use

    Returns:
        PIL Image object with dithered result or None on error
    """
    url = 'http://localhost:5000/api/dither'

    # Convert PIL Image to bytes
    img_byte_arr = BytesIO()
    pil_image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)

    files = {'file': ('image.png', img_byte_arr, 'image/png')}
    data = {'algorithm': algorithm}

    response = requests.post(url, files=files, data=data)

    if response.status_code == 200:
        return Image.open(BytesIO(response.content))
    else:
        print(f"Error: {response.json().get('error', 'Unknown error')}")
        return None

# Usage
img = Image.open('photo.jpg')
dithered = dither_pil_image(img, algorithm='bayer')
if dithered:
    dithered.save('output.png')
```

### Async Processing with aiohttp

```python
import aiohttp
import asyncio
from pathlib import Path

async def dither_async(session, image_path, algorithm, output_path):
    """Asynchronously dither a single image."""
    url = 'http://localhost:5000/api/dither'

    with open(image_path, 'rb') as f:
        data = aiohttp.FormData()
        data.add_field('file', f, filename=image_path.name)
        data.add_field('algorithm', algorithm)

        async with session.post(url, data=data) as response:
            if response.status == 200:
                content = await response.read()
                with open(output_path, 'wb') as out_f:
                    out_f.write(content)
                return True, output_path
            else:
                error = await response.json()
                return False, error.get('error', 'Unknown error')

async def batch_dither_async(image_files, algorithm='floyd-steinberg'):
    """Process multiple images concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = []
        for image_path in image_files:
            output_path = Path(f"output_{image_path.stem}_{algorithm}.png")
            task = dither_async(session, image_path, algorithm, output_path)
            tasks.append(task)

        results = await asyncio.gather(*tasks)

        for image_path, (success, result) in zip(image_files, results):
            if success:
                print(f"✓ {image_path.name} -> {result}")
            else:
                print(f"✗ {image_path.name}: {result}")

# Usage
image_files = [Path('photo1.jpg'), Path('photo2.jpg'), Path('photo3.jpg')]
asyncio.run(batch_dither_async(image_files, algorithm='floyd-steinberg'))
```

## JavaScript Examples

### Using Fetch API

```javascript
/**
 * Dither an image file using the API.
 *
 * @param {File} file - Image file to process
 * @param {string} algorithm - Dithering algorithm to use
 * @returns {Promise<Blob>} Dithered image as Blob
 */
async function ditherImage(file, algorithm = 'floyd-steinberg') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('algorithm', algorithm);

  const response = await fetch('http://localhost:5000/api/dither', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unknown error');
  }

  return await response.blob();
}

// Usage
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const ditheredBlob = await ditherImage(file, 'floyd-steinberg');

    // Display the result
    const url = URL.createObjectURL(ditheredBlob);
    const img = document.createElement('img');
    img.src = url;
    document.body.appendChild(img);

    // Or download it
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dithered.png';
    link.click();
  } catch (error) {
    console.error('Dithering failed:', error);
  }
});
```

### Node.js Example

```javascript
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function ditherImage(imagePath, algorithm = 'floyd-steinberg', outputPath = 'output.png') {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath));
  formData.append('algorithm', algorithm);

  const response = await fetch('http://localhost:5000/api/dither', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unknown error');
  }

  const buffer = await response.buffer();
  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved to ${outputPath}`);
}

// Usage
ditherImage('photo.jpg', 'atkinson', 'dithered.png')
  .catch(console.error);
```

### Batch Processing with Promise.all

```javascript
async function batchDither(files, algorithms = ['floyd-steinberg']) {
  const results = [];

  for (const file of files) {
    for (const algorithm of algorithms) {
      results.push(
        ditherImage(file, algorithm)
          .then(blob => ({
            file: file.name,
            algorithm,
            success: true,
            blob
          }))
          .catch(error => ({
            file: file.name,
            algorithm,
            success: false,
            error: error.message
          }))
      );
    }
  }

  return await Promise.all(results);
}

// Usage
const files = [file1, file2, file3];
const results = await batchDither(files, ['floyd-steinberg', 'atkinson']);

results.forEach(result => {
  if (result.success) {
    console.log(`✓ ${result.file} with ${result.algorithm}`);
    // Handle the blob
  } else {
    console.error(`✗ ${result.file} with ${result.algorithm}: ${result.error}`);
  }
});
```

## Error Handling

### Common Error Responses

```json
// Missing file
{
  "error": "No file part"
}

// Invalid file type
{
  "error": "Invalid file type"
}

// Invalid algorithm
{
  "error": "Invalid algorithm"
}

// Corrupted image
{
  "error": "Invalid or corrupted image file"
}

// File too large (>32MB)
{
  "error": "Request entity too large"
}

// Server error
{
  "error": "Error message describing the issue"
}
```

### Comprehensive Error Handling Example (Python)

```python
import requests
from requests.exceptions import RequestException

def dither_with_error_handling(image_path, algorithm='floyd-steinberg'):
    """Dither image with comprehensive error handling."""
    url = 'http://localhost:5000/api/dither'

    try:
        with open(image_path, 'rb') as f:
            files = {'file': f}
            data = {'algorithm': algorithm}

            response = requests.post(url, files=files, data=data, timeout=30)

        response.raise_for_status()

        # Save successful result
        output_path = f"{algorithm}_output.png"
        with open(output_path, 'wb') as f:
            f.write(response.content)

        return {'success': True, 'output': output_path}

    except FileNotFoundError:
        return {'success': False, 'error': f"File not found: {image_path}"}

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 400:
            error_msg = e.response.json().get('error', 'Bad request')
            return {'success': False, 'error': f"Bad request: {error_msg}"}
        elif e.response.status_code == 413:
            return {'success': False, 'error': 'File too large (max 32MB)'}
        else:
            return {'success': False, 'error': f"HTTP error: {e.response.status_code}"}

    except requests.exceptions.Timeout:
        return {'success': False, 'error': 'Request timed out'}

    except RequestException as e:
        return {'success': False, 'error': f"Network error: {str(e)}"}

    except Exception as e:
        return {'success': False, 'error': f"Unexpected error: {str(e)}"}

# Usage
result = dither_with_error_handling('photo.jpg', 'floyd-steinberg')
if result['success']:
    print(f"Success! Saved to {result['output']}")
else:
    print(f"Error: {result['error']}")
```

## Rate Limiting

Currently, the API does not enforce rate limiting. However, for production deployments:

- Recommended: Limit to 100 requests per minute per IP
- Maximum file size: 32MB
- Supported formats: PNG, JPEG, GIF, WebP

For high-volume processing, consider:
1. Implementing client-side throttling
2. Using async/parallel processing efficiently
3. Caching results when possible
4. Monitoring server resources

## Performance Tips

1. **Image Size**: Larger images take longer to process. Consider resizing images before processing if you don't need high resolution.

2. **Algorithm Selection**: Different algorithms have different performance characteristics:
   - Fastest: Ordered, Bayer (threshold-based)
   - Slower: Floyd-Steinberg, Atkinson (error diffusion)

3. **Batch Processing**: When processing multiple images, use async/parallel requests to improve throughput.

4. **Network**: Keep images under 5MB for best network performance.

## Additional Resources

- [README.md](README.md) - Project overview and setup
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute to the project
- API endpoint: `/api/dither` (POST)
- Web interface: `/` (GET)
