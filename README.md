# 🤖 AI Slop Detector - Chrome Extension

A powerful Chrome extension that detects AI-generated text vs human-written content using a fine-tuned Gemma 270M model running entirely in your browser via WebGPU.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![WebGPU](https://img.shields.io/badge/WebGPU-required-orange.svg)

## ✨ Features

- 🔍 **Real-time AI Detection** - Analyze any text on any webpage
- 🚀 **Fully Offline** - Runs 100% locally after initial model download
- 🔒 **Privacy-First** - Your text never leaves your browser
- ⚡ **WebGPU Accelerated** - Fast inference using GPU acceleration
- 🎯 **Context Menu Integration** - Right-click any selected text to analyze
- 📊 **Fine-tuned Model** - Custom-trained Gemma 270M for AI detection
- 💾 **Smart Caching** - Model downloads once, cached for instant future use

## 🎥 Demo

### Using Context Menu
1. Select text on any webpage
2. Right-click → "Check if AI Slop"
3. Click extension icon for results

### Using Popup Interface
1. Click extension icon
2. Paste or type text
3. Click "Analyze Text"

## 📋 Prerequisites

Before you begin, ensure you have:

- **Google Chrome** version 113+ or **Microsoft Edge** 113+
- **GPU with WebGPU support** (check at `chrome://gpu`)
- **Node.js** version 16+ and npm
- **Git** installed
- **150MB free disk space** for model files

### Check WebGPU Support

1. Open Chrome/Edge
2. Navigate to `chrome://gpu`
3. Search for "WebGPU" - should say "Hardware accelerated"
4. If not supported, update your browser or graphics drivers


### Model Configuration


```javascript
const MODEL_CONFIG = {
    model_url: "https://huggingface.co/Priyansu19/gemma-270m-ai-detector/resolve/main/",
    model_id: "gemma-270m-ai-detector",
    model_lib_url: "https://huggingface.co/Priyansu19/gemma-270m-ai-detector/resolve/main/gemma-270m-ai-detector-webgpu.wasm",
};
```

After updating, rebuild:

```bash
npm run build
```

### Step 6: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `ai-slop-detector-extension` folder
5. The extension should now appear in your toolbar!

## 📖 Usage Guide

### First Time Setup

1. **Click the extension icon** in Chrome toolbar
2. **Wait for model to load** (2-5 minutes on first run)
   - Progress bar shows download status
   - Console logs show detailed progress (right-click popup → Inspect)
3. Once you see **"✓ Model ready!"**, you're good to go!

### Method 1: Context Menu (Quick Check)

1. **Select any text** on any webpage
2. **Right-click** on selected text
3. **Choose "Check if AI Slop"**
4. **Click extension icon** to see results
5. Results appear automatically

### Method 2: Manual Input

1. **Click extension icon**
2. **Paste or type text** in the text area
3. **Click "Analyze Text"**
4. View results instantly

### Understanding Results

- 🤖 **AI-Generated**: Text shows patterns typical of AI writing
- ✍️ **Human-Written**: Text appears naturally human-written
- ❓ **Uncertain**: Model couldn't determine with confidence

## 🛠️ Development

### Project Structure

```
ai-slop-detector-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Popup UI
├── popup.js              # Main logic (source)
├── popup-bundle.js       # Bundled version (generated)
├── background.js         # Service worker & context menu
├── content.js            # Content script for notifications
├── package.json          # Dependencies
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── node_modules/         # Dependencies (not committed)
└── README.md            # This file
```

### Build Commands

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch
```

### Making Changes

1. Edit `popup.js` (not `popup-bundle.js`)
2. Run `npm run build`
3. Reload extension in `chrome://extensions/`
4. Test changes

## 🔧 Troubleshooting

### Model Not Loading

**Problem:** Stuck on "Loading model..."

**Solutions:**
1. Open DevTools (right-click popup → Inspect)
2. Check Console for errors
3. Verify WebGPU: Go to `chrome://gpu`, search for "WebGPU"
4. Check Network tab - should see files downloading from HuggingFace
5. Ensure HuggingFace repository is **public**
6. Verify URLs in `popup.js` are correct

### WebGPU Not Supported

**Problem:** Error: "WebGPU is not supported"

**Solutions:**
1. Update Chrome to version 113+
2. Update graphics drivers
3. Try Microsoft Edge instead
4. Check `chrome://flags` - enable WebGPU if available

### Context Menu Not Working

**Problem:** "Check if AI Slop" doesn't appear

**Solutions:**
1. Reload extension in `chrome://extensions/`
2. Refresh the webpage
3. Check if extension is enabled
4. Look for errors in background service worker console

### Analysis Errors

**Problem:** "Error: Model not loaded yet"

**Solutions:**
1. Click extension icon first
2. Wait for "✓ Model ready!" status
3. Then try analyzing text

### Build Errors

**Problem:** `npm run build` fails

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🎨 Customization

### Change Model

Edit `popup.js` to use a different model:

```javascript
const MODEL_CONFIG = {
    model_url: "https://huggingface.co/YOUR_REPO/resolve/main/",
    model_id: "your-model-id",
    model_lib_url: "https://huggingface.co/YOUR_REPO/resolve/main/model.wasm",
};
```

### Modify UI

Edit `popup.html` to change:
- Colors and styling
- Layout
- Text and labels

### Adjust Inference Parameters

Edit `popup.js` in the `analyzeText()` function:

```javascript
const reply = await engine.chat.completions.create({
    messages: messages,
    temperature: 0.1,      // Lower = more deterministic
    max_tokens: 5,         // Maximum response length
    repetition_penalty: 1.5, // Prevent repetition
});
```

## 📊 Model Details

- **Base Model:** Google Gemma 270M
- **Fine-tuning:** Custom dataset of AI vs human text
- **Quantization:** q4f16_1 (4-bit weights, 16-bit activations)
- **Size:** ~150MB
- **Context Window:** 8192 tokens
- **Inference:** WebGPU accelerated

## 🔒 Privacy & Security

- ✅ **100% Offline** - After initial download, no internet required
- ✅ **No Data Collection** - Your text never leaves your browser
- ✅ **No Tracking** - No analytics or telemetry
- ✅ **No External APIs** - All processing local
- ✅ **Open Source** - Fully auditable code

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test on multiple websites
- Update README if adding features
- Keep bundle size minimal

## 📝 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- **[WebLLM](https://github.com/mlc-ai/web-llm)** - For browser-based LLM inference
- **[Google Gemma](https://ai.google.dev/gemma)** - Base model
- **[HuggingFace](https://huggingface.co)** - Model hosting
- **Chrome Team** - For WebGPU support

## 📧 Support

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/ai-slop-detector-extension/issues)
- **Discussions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/ai-slop-detector-extension/discussions)
- **Email:** your.email@example.com

## 🗺️ Roadmap

- [ ] Support for Firefox (WebGPU when available)
- [ ] Batch analysis for multiple texts
- [ ] Confidence scores
- [ ] Explanations for classifications
- [ ] Support for more languages
- [ ] Offline model updates

## ⭐ Star History

If you find this useful, please consider starring the repo!

---

**Made with ❤️ using WebLLM and fine-tuned Gemma 270M**