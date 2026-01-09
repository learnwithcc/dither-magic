# Troubleshooting Guide

This guide covers common issues and their solutions for Dither Magic.

## Table of Contents

- [API Errors](#api-errors)
- [Development Issues](#development-issues)
- [Performance Issues](#performance-issues)
- [Build Issues](#build-issues)
- [Browser Issues](#browser-issues)

---

## API Errors

### "No file part"

**Error Message:**
```json
{
  "error": "No file part"
}
```

**Cause:** The file wasn't included in the request or was sent with the wrong field name.

**Solution:**
Ensure you're sending the file with the field name `file`:

```bash
# Correct
curl -F "file=@image.jpg" http://localhost:5000/api/dither

# Incorrect
curl -F "image=@image.jpg" http://localhost:5000/api/dither
```

```python
# Correct
files = {'file': open('image.jpg', 'rb')}
requests.post(url, files=files)

# Incorrect
files = {'image': open('image.jpg', 'rb')}
requests.post(url, files=files)
```

---

### "Invalid file type"

**Error Message:**
```json
{
  "error": "Invalid file type"
}
```

**Cause:** The uploaded file is not a supported image format.

**Supported Formats:**
- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- WebP (.webp)

**Solution:**
1. Check the file extension
2. Verify the file isn't corrupted
3. Convert the file to a supported format:

```bash
# Using ImageMagick
convert input.bmp output.png

# Using Pillow (Python)
from PIL import Image
img = Image.open('input.bmp')
img.save('output.png')
```

---

### "Request entity too large"

**Error Message:**
```
413 Request Entity Too Large
```

**Cause:** Image file exceeds the 32MB limit.

**Solution:**

**Option 1: Resize the image**
```python
from PIL import Image

img = Image.open('large_image.jpg')
# Resize to 50% of original
img = img.resize((img.width // 2, img.height // 2))
img.save('resized_image.jpg')
```

**Option 2: Compress the image**
```python
from PIL import Image

img = Image.open('large_image.jpg')
img.save('compressed.jpg', quality=85, optimize=True)
```

**Option 3: Convert to PNG**
```python
from PIL import Image

img = Image.open('large_image.jpg')
img.save('converted.png', optimize=True)
```

---

### "Invalid algorithm"

**Error Message:**
```json
{
  "error": "Invalid algorithm"
}
```

**Cause:** The specified algorithm name doesn't exist.

**Valid Algorithm Names:**
- `floyd-steinberg`
- `atkinson`
- `stucki`
- `jarvis`
- `burkes`
- `sierra`
- `sierra-two-row`
- `sierra-lite`
- `ordered`
- `bayer`
- `halftone`
- `blue-noise`

**Solution:**
Check the algorithm name spelling and use one of the valid names above.

---

### "Invalid or corrupted image file"

**Error Message:**
```json
{
  "error": "Invalid or corrupted image file"
}
```

**Cause:** The file is corrupted, truncated, or not actually an image.

**Solution:**
1. Try opening the image in an image viewer to verify it's valid
2. Re-download or re-save the image
3. Try converting it to a different format
4. Check that the entire file was uploaded (not truncated)

---

### Processing Takes Too Long / Timeout

**Symptoms:**
- Request times out
- No response after several minutes
- Server becomes unresponsive

**Causes:**
- Image is very large (>10MB)
- Server is under heavy load
- Slow network connection

**Solutions:**

**1. Resize the image before uploading:**
```python
from PIL import Image

def resize_if_large(image_path, max_size=5000000):  # 5MB
    img = Image.open(image_path)

    # Check file size
    file_size = os.path.getsize(image_path)
    if file_size > max_size:
        # Reduce dimensions
        factor = (max_size / file_size) ** 0.5
        new_size = (int(img.width * factor), int(img.height * factor))
        img = img.resize(new_size, Image.LANCZOS)

    return img
```

**2. Use faster algorithms for large images:**
- Fast: `ordered`, `bayer`, `sierra-lite`
- Slow: `jarvis`, `stucki`, `sierra`

**3. Increase timeout in your client:**
```python
# Python
response = requests.post(url, files=files, timeout=60)  # 60 seconds

# JavaScript
fetch(url, {
  method: 'POST',
  body: formData,
  signal: AbortSignal.timeout(60000)  // 60 seconds
})
```

---

### CORS Errors

**Error Message:**
```
Access to fetch at 'http://localhost:5000/api/dither' from origin 'http://example.com'
has been blocked by CORS policy
```

**Cause:** Cross-Origin Resource Sharing (CORS) is not configured for cross-origin requests.

**Solution:**

**Option 1: Enable CORS in Flask (for development only)**
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
```

Install flask-cors:
```bash
pip install flask-cors
```

**Option 2: Use a proxy**
Configure your frontend dev server to proxy API requests:

```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
}
```

---

## Development Issues

### Port 5000 Already in Use

**Error Message:**
```
OSError: [Errno 48] Address already in use
```

**Cause:** Another process is using port 5000.

**Solutions:**

**Option 1: Kill the process using port 5000**
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Option 2: Use a different port**
```python
# app.py
if __name__ == '__main__':
    app.run(port=5001)  # Use port 5001 instead
```

---

### Module Not Found Errors

**Error Message:**
```
ModuleNotFoundError: No module named 'flask'
```

**Cause:** Dependencies are not installed.

**Solution:**

**Backend:**
```bash
pip install pillow numpy werkzeug flask

# Or use requirements.txt if available
pip install -r requirements.txt
```

**Frontend:**
```bash
npm install
```

**Virtual Environment Issues:**
Make sure you're in the correct virtual environment:
```bash
# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install pillow numpy werkzeug flask
```

---

### Vite Dev Server Not Connecting to Backend

**Error:** API calls fail with network errors

**Cause:** Vite proxy is not configured correctly.

**Solution:**

Check `vite.config.js`:
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/dither': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

Ensure Flask is running on port 5000:
```bash
# In separate terminal
python app.py
```

---

### Static Files Not Loading

**Error:** Images, CSS, or JS files return 404 errors.

**Cause:** Files are not in the correct location or Flask isn't serving them.

**Solution:**

1. Check file locations:
   - Static files should be in `static/` directory
   - Templates should be in `templates/` directory

2. Verify Flask configuration:
   ```python
   app = Flask(__name__,
               static_folder='static',
               static_url_path='/static')
   ```

3. Build frontend assets:
   ```bash
   npm run build
   ```

---

### Changes Not Reflecting in Browser

**Cause:** Browser cache or build cache issues.

**Solutions:**

1. **Hard refresh the browser:**
   - Chrome/Firefox: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Safari: `Cmd+Option+R`

2. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Disable browser cache:**
   - Open DevTools (F12)
   - Go to Network tab
   - Check "Disable cache"

---

## Performance Issues

### Slow Processing Times

**Symptoms:**
- Images take >60 seconds to process
- UI becomes unresponsive
- Browser tab freezes

**Solutions:**

**1. Optimize image size:**
```python
# Resize images before processing
max_dimension = 2000
if img.width > max_dimension or img.height > max_dimension:
    ratio = max_dimension / max(img.width, img.height)
    new_size = (int(img.width * ratio), int(img.height * ratio))
    img = img.resize(new_size, Image.LANCZOS)
```

**2. Use faster algorithms:**
- Ordered Dithering
- Bayer
- Sierra Lite

**3. Process smaller batches:**
Instead of processing 50 images at once, process them in batches of 5-10.

**4. Reduce image dimensions:**
For web use, images larger than 2000x2000 pixels are usually unnecessary.

---

### High Memory Usage

**Symptoms:**
- Process crashes with "MemoryError"
- System becomes sluggish
- Out of memory errors

**Solutions:**

**1. Process images one at a time:**
```python
# Instead of loading all images at once
for image_path in image_paths:
    img = Image.open(image_path)
    result = process_image(img)
    result.save(f'output_{image_path}')
    # Free memory
    del img
    del result
```

**2. Limit maximum image size:**
```python
MAX_PIXELS = 4000 * 4000  # 16 megapixels

img = Image.open(path)
if img.width * img.height > MAX_PIXELS:
    raise ValueError("Image too large")
```

**3. Increase system swap space** (for Linux/Mac):
```bash
# Check current swap
swapon --show

# Add swap file (example: 4GB)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Build Issues

### Build Fails with Errors

**Error:** Various TypeScript, linting, or build errors

**Solutions:**

**1. Clear caches and reinstall:**
```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

**2. Check Node version:**
```bash
node --version  # Should be 18 or higher
```

**3. Update dependencies:**
```bash
npm update
```

---

### Production Build Size Too Large

**Issue:** Built files are several megabytes.

**Solutions:**

**1. Enable minification:**
Ensure `vite.config.js` has:
```javascript
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true  // Remove console.logs
      }
    }
  }
}
```

**2. Analyze bundle:**
```bash
npm run build -- --mode analyze
```

**3. Code splitting:**
```javascript
// Use dynamic imports
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

---

## Browser Issues

### Drag and Drop Not Working

**Cause:** Browser compatibility or JavaScript errors.

**Solutions:**

1. Check browser console for errors (F12)
2. Ensure JavaScript is enabled
3. Try a different browser (Chrome, Firefox, Safari)
4. Clear browser cache and cookies

---

### Images Not Displaying

**Cause:** MIME type issues or image format problems.

**Solutions:**

1. Check that images are valid:
   ```bash
   file output.png  # Should show: PNG image data
   ```

2. Verify server is sending correct MIME type:
   ```python
   return send_file(
       image_buffer,
       mimetype='image/png',
       as_attachment=True,
       download_name='dithered.png'
   )
   ```

3. Check browser console for errors

---

## Getting Help

If you're still experiencing issues:

1. **Check existing issues:** Search [GitHub Issues](https://github.com/learnwithcc/dither-magic/issues)
2. **Create a new issue:** Include:
   - Error messages
   - Steps to reproduce
   - System information (OS, Python version, Node version)
   - Screenshots if relevant
3. **Provide context:** What were you trying to do? What did you expect? What happened instead?

---

## Debug Mode

Enable debug mode to get more detailed error messages:

**Backend:**
```python
# app.py
app.run(debug=True)
```

**Frontend:**
```javascript
// Add to vite.config.js
export default {
  build: {
    sourcemap: true
  }
}
```

This will provide stack traces and detailed error information to help identify issues.
