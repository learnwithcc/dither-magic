<div align="center">

# 🎨 Dither Magic

### Transform your images with classic dithering algorithms

*A powerful web app and REST API for applying 12 different dithering effects to your images*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-lightgrey.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)

[Live Demo](#) • [API Docs](docs/API.md) • [Algorithm Guide](docs/ALGORITHMS.md) • [Contributing](CONTRIBUTING.md)

</div>

---

## ✨ Features

- 🎯 **12 Dithering Algorithms** - From classic Floyd-Steinberg to modern Blue Noise
- 🚀 **Batch Processing** - Process multiple images with multiple algorithms simultaneously
- 🎨 **Beautiful UI** - Modern, responsive interface with drag-and-drop support
- 🔌 **REST API** - Programmatic access for automation and integration
- 📦 **Bulk Download** - Export all results as a convenient ZIP file
- 🔍 **Image Preview** - Zoom and compare input/output images side-by-side
- 💾 **Smart Persistence** - Your algorithm preferences are automatically saved
- 📱 **Mobile Friendly** - Works seamlessly on desktop and mobile devices

## 🎭 Available Algorithms

<table>
  <tr>
    <td align="center"><b>Floyd-Steinberg</b><br/>Classic error diffusion</td>
    <td align="center"><b>Atkinson</b><br/>Mac classic style</td>
    <td align="center"><b>Stucki</b><br/>Smooth gradients</td>
    <td align="center"><b>Jarvis</b><br/>High detail preservation</td>
  </tr>
  <tr>
    <td align="center"><b>Burkes</b><br/>Balanced quality/speed</td>
    <td align="center"><b>Sierra</b><br/>Minimal artifacts</td>
    <td align="center"><b>Sierra Two-Row</b><br/>Faster Sierra variant</td>
    <td align="center"><b>Sierra Lite</b><br/>Quick previews</td>
  </tr>
  <tr>
    <td align="center"><b>Ordered</b><br/>Retro pixel pattern</td>
    <td align="center"><b>Bayer</b><br/>Regular dot pattern</td>
    <td align="center"><b>Halftone</b><br/>Print-style dots</td>
    <td align="center"><b>Blue Noise</b><br/>Film grain aesthetic</td>
  </tr>
</table>

> 📖 **Want to know more?** Check out the comprehensive [Algorithm Guide](docs/ALGORITHMS.md) for detailed technical information about each algorithm.

## 🚀 Quick Start

### Web Interface

1. **Upload** your images (drag-and-drop or click to browse)
2. **Select** one or more dithering algorithms
3. **Process** your images with one click
4. **Download** individual results or bulk download as ZIP

### API Usage

Process images programmatically in seconds:

```bash
curl -X POST \
  -F "file=@photo.jpg" \
  -F "algorithm=floyd-steinberg" \
  https://your-deployment-url.com/api/dither \
  -o dithered.png
```

**Python Example:**
```python
import requests

url = 'https://your-deployment-url.com/api/dither'
files = {'file': open('photo.jpg', 'rb')}
data = {'algorithm': 'atkinson'}

response = requests.post(url, files=files, data=data)

with open('dithered.png', 'wb') as f:
    f.write(response.content)
```

> 📖 **Need more examples?** See [API_EXAMPLES.md](API_EXAMPLES.md) for comprehensive examples in Python, JavaScript, cURL, and more.

## 💻 Development Setup

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- pip and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/learnwithcc/dither-magic.git
cd dither-magic

# Install backend dependencies
pip install pillow numpy werkzeug flask

# Install frontend dependencies
npm install
```

### Running Locally

Start both servers in separate terminals:

```bash
# Terminal 1: Start Flask backend
python app.py

# Terminal 2: Start Vite dev server
npm run dev
```

Then open http://localhost:5173 in your browser.

> 📖 **Need help?** Check out the [Development Guide](docs/DEVELOPMENT.md) for detailed setup instructions.

## 🎨 Use Cases

- **Retro Graphics** - Create authentic 1-bit artwork with vintage computing aesthetics
- **Print Design** - Generate halftone patterns for screen printing and offset printing
- **Web Optimization** - Reduce image file sizes while maintaining visual interest
- **Artistic Effects** - Add unique textures and patterns to photography and digital art
- **Game Development** - Create pixel-perfect assets for retro-style games
- **Data Visualization** - Apply dithering to scientific visualizations and charts

## 📚 Documentation

- **[API Reference](docs/API.md)** - Complete REST API documentation
- **[Algorithm Guide](docs/ALGORITHMS.md)** - Detailed algorithm descriptions and comparisons
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, coding standards, and best practices
- **[Architecture](docs/ARCHITECTURE.md)** - Technical architecture and component details
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[API Examples](API_EXAMPLES.md)** - Practical code examples in multiple languages
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project

## 🛠️ Tech Stack

**Backend**
- Flask - Web framework
- Pillow - Image processing
- NumPy - Efficient array operations

**Frontend**
- React - UI framework
- Vite - Build tool
- TailwindCSS - Styling
- Radix UI - Accessible components

## 🎯 Performance

- **Maximum file size**: 32MB per image
- **Supported formats**: PNG, JPEG, GIF, WebP
- **Processing time**: 1-60 seconds depending on image size and algorithm
- **Recommended**: Images under 5MB for optimal performance

## 🤝 Contributing

We welcome contributions! Whether you want to:

- 🐛 Fix bugs
- ✨ Add new dithering algorithms
- 📖 Improve documentation
- 🎨 Enhance the UI
- 🚀 Optimize performance

Check out our [Contributing Guide](CONTRIBUTING.md) to get started!

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Dithering algorithms based on research by Robert Floyd, Louis Steinberg, Bill Atkinson, and others
- Built with modern web technologies and open-source tools
- Inspired by the retro computing and digital art communities

## 📬 Support

- 🐛 [Report bugs](https://github.com/learnwithcc/dither-magic/issues)
- 💡 [Request features](https://github.com/learnwithcc/dither-magic/issues)
- 📖 [Read the docs](docs/)
- ⭐ Star this repo if you find it useful!

---

<div align="center">

**Made with ❤️ by the Dither Magic team**

[⬆ Back to Top](#-dither-magic)

</div>
