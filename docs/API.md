# API Reference

Complete technical reference for the Dither Magic REST API.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: Your deployment URL

## Authentication

Currently, the API does not require authentication. For production deployments, consider implementing:
- API keys
- Rate limiting
- IP allowlisting

## Endpoints

### POST /api/dither

Process an image using a specified dithering algorithm.

#### Request

**Content-Type:** `multipart/form-data`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | Image file to process (PNG, JPEG, GIF, WebP) |
| `algorithm` | String | No | Dithering algorithm (default: `floyd-steinberg`) |

**Supported Algorithms:**

| Value | Algorithm Name |
|-------|----------------|
| `floyd-steinberg` | Floyd-Steinberg (default) |
| `atkinson` | Atkinson |
| `stucki` | Stucki |
| `jarvis` | Jarvis-Judice-Ninke |
| `burkes` | Burkes |
| `sierra` | Sierra (3-Row) |
| `sierra-two-row` | Sierra Two-Row |
| `sierra-lite` | Sierra Lite |
| `ordered` | Ordered Dithering |
| `bayer` | Bayer |
| `halftone` | Halftone |
| `blue-noise` | Blue Noise |

**File Constraints:**
- Maximum size: 32MB
- Supported formats: PNG, JPEG, GIF, WebP
- Recommended size: Under 5MB for optimal performance

#### Response

**Success (200 OK):**
- Content-Type: `image/png`
- Body: Binary PNG image data

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | `No file part` | Request missing file |
| 400 | `No selected file` | File field is empty |
| 400 | `Invalid file type` | Unsupported image format |
| 400 | `Invalid algorithm` | Algorithm name not recognized |
| 400 | `Invalid or corrupted image file` | File cannot be opened as an image |
| 413 | `Request entity too large` | File exceeds 32MB limit |
| 500 | Various | Server error during processing |

**Error Response Format:**
```json
{
  "error": "Error description"
}
```

#### Examples

**cURL:**
```bash
curl -X POST \
  -F "file=@image.jpg" \
  -F "algorithm=floyd-steinberg" \
  http://localhost:5000/api/dither \
  -o output.png
```

**Python (requests):**
```python
import requests

url = 'http://localhost:5000/api/dither'
files = {'file': open('image.jpg', 'rb')}
data = {'algorithm': 'atkinson'}

response = requests.post(url, files=files, data=data)

if response.status_code == 200:
    with open('output.png', 'wb') as f:
        f.write(response.content)
```

**JavaScript (Fetch API):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('algorithm', 'floyd-steinberg');

const response = await fetch('http://localhost:5000/api/dither', {
  method: 'POST',
  body: formData
});

const blob = await response.blob();
```

**Node.js:**
```javascript
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

const formData = new FormData();
formData.append('file', fs.createReadStream('image.jpg'));
formData.append('algorithm', 'atkinson');

const response = await fetch('http://localhost:5000/api/dither', {
  method: 'POST',
  body: formData
});

const buffer = await response.buffer();
fs.writeFileSync('output.png', buffer);
```

## Rate Limiting

### Current Implementation

The API currently does not enforce rate limiting.

### Recommendations for Production

- **Per-IP limit**: 100 requests per minute
- **Per-endpoint limit**: 50 requests per minute
- **Concurrent requests**: 10 per IP

### Implementing Rate Limiting

Use Flask-Limiter for basic rate limiting:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per minute"]
)

@app.route('/api/dither', methods=['POST'])
@limiter.limit("50 per minute")
def dither_api():
    # Implementation
    pass
```

## Performance Considerations

### Processing Time

Approximate processing times by image size and algorithm:

| Image Size | Fast Algorithms* | Medium Algorithms** | Slow Algorithms*** |
|------------|------------------|---------------------|-------------------|
| < 1MB | 1-2s | 2-4s | 3-6s |
| 1-5MB | 3-5s | 5-10s | 10-20s |
| 5-10MB | 10-15s | 15-30s | 30-60s |
| 10-32MB | 20-40s | 40-90s | 90-180s |

\* Fast: ordered, bayer, sierra-lite
** Medium: floyd-steinberg, atkinson, burkes, sierra-two-row
*** Slow: stucki, jarvis, sierra, halftone, blue-noise

### Optimization Tips

1. **Resize images client-side** before uploading
2. **Use faster algorithms** for real-time or preview use cases
3. **Implement caching** for repeated requests
4. **Use async processing** for batch operations
5. **Compress images** before uploading

### Memory Usage

Memory usage scales with image dimensions:

| Image Dimensions | Approximate Memory |
|------------------|-------------------|
| 1000x1000 | ~12 MB |
| 2000x2000 | ~48 MB |
| 4000x4000 | ~192 MB |
| 6000x6000 | ~432 MB |

## Error Handling

### Best Practices

Always implement proper error handling in your client code:

```python
import requests
from requests.exceptions import RequestException

def dither_image_safe(image_path, algorithm='floyd-steinberg'):
    url = 'http://localhost:5000/api/dither'

    try:
        with open(image_path, 'rb') as f:
            files = {'file': f}
            data = {'algorithm': algorithm}
            response = requests.post(url, files=files, data=data, timeout=60)

        response.raise_for_status()
        return response.content

    except FileNotFoundError:
        print(f"File not found: {image_path}")
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 400:
            error = e.response.json().get('error', 'Bad request')
            print(f"Bad request: {error}")
        elif e.response.status_code == 413:
            print("File too large (max 32MB)")
        else:
            print(f"HTTP error {e.response.status_code}")
    except requests.exceptions.Timeout:
        print("Request timed out")
    except RequestException as e:
        print(f"Network error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

    return None
```

### Retry Logic

For production use, implement exponential backoff for transient errors:

```python
import time
import requests

def dither_with_retry(image_path, algorithm='floyd-steinberg', max_retries=3):
    url = 'http://localhost:5000/api/dither'

    for attempt in range(max_retries):
        try:
            with open(image_path, 'rb') as f:
                files = {'file': f}
                data = {'algorithm': algorithm}
                response = requests.post(url, files=files, data=data, timeout=60)

            response.raise_for_status()
            return response.content

        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                print(f"Attempt {attempt + 1} failed, retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"All {max_retries} attempts failed")
                raise

    return None
```

## CORS Configuration

For cross-origin requests, configure CORS in Flask:

```python
from flask_cors import CORS

# Allow all origins (development only)
CORS(app)

# Or configure specific origins (production)
CORS(app, origins=[
    "https://yourdomain.com",
    "https://app.yourdomain.com"
])
```

Install flask-cors:
```bash
pip install flask-cors
```

## Batch Processing

For processing multiple images, use parallel requests:

### Python (asyncio + aiohttp)

```python
import aiohttp
import asyncio

async def dither_batch(image_paths, algorithm='floyd-steinberg'):
    async with aiohttp.ClientSession() as session:
        tasks = []
        for path in image_paths:
            task = dither_async(session, path, algorithm)
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results

async def dither_async(session, image_path, algorithm):
    url = 'http://localhost:5000/api/dither'

    with open(image_path, 'rb') as f:
        data = aiohttp.FormData()
        data.add_field('file', f, filename=image_path)
        data.add_field('algorithm', algorithm)

        async with session.post(url, data=data) as response:
            if response.status == 200:
                return await response.read()
            else:
                error = await response.json()
                raise Exception(error.get('error'))

# Usage
results = asyncio.run(dither_batch(['img1.jpg', 'img2.jpg', 'img3.jpg']))
```

### JavaScript (Promise.all)

```javascript
async function ditherBatch(files, algorithm = 'floyd-steinberg') {
  const promises = files.map(file => ditherImage(file, algorithm));
  const results = await Promise.allSettled(promises);

  return results.map((result, index) => ({
    file: files[index].name,
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}

async function ditherImage(file, algorithm) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('algorithm', algorithm);

  const response = await fetch('http://localhost:5000/api/dither', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.blob();
}
```

## Webhooks (Future Feature)

Future versions may support webhooks for async processing:

```json
POST /api/dither
{
  "file_url": "https://example.com/image.jpg",
  "algorithm": "floyd-steinberg",
  "webhook_url": "https://yourapp.com/webhook"
}

// Webhook callback
POST https://yourapp.com/webhook
{
  "status": "completed",
  "result_url": "https://api.dither-magic.com/results/abc123.png",
  "processing_time": 3.24
}
```

## Additional Resources

- [API Examples](../API_EXAMPLES.md) - Practical code examples
- [Algorithm Reference](ALGORITHMS.md) - Detailed algorithm descriptions
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

## Support

For API support:
- Open an issue on [GitHub](https://github.com/learnwithcc/dither-magic/issues)
- Check existing [documentation](../README.md)
- Review [API examples](../API_EXAMPLES.md)
