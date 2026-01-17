# Sprite Studio 🎨🚀

**Sprite Studio** is a powerful, web-based tool designed for technical artists and game developers to convert video sequences into professional sprite sheets and perform advanced sprite manipulations.

![Sprite Studio Preview](https://github.com/ilanlenzner-design/Sprite-Studio/raw/main/test.png) *(Placeholder for actual preview)*

## ✨ Key Features

- **Video to Sprite Sheet**: Capture high-quality frames directly from video files with adjustable strides and scaling.
- **Advanced Transformations**: Rotate (90°/180°/270°), Flip (Horizontal/Vertical), and real-time canvas resizing.
- **Background Removal**: Built-in Chroma Key and Alpha Thresholding with live preview.
- **AI-Powered Analysis**: Integrated Gemini & Replicate models for grid detection and sprite island normalization.
- **Quick Filters**: Instant Black & White and Invert filters for rapid prototyping.
- **Smart Playback**: Real-time animation preview that automatically skips empty grid slots for smooth looping.
- **Multi-Format Export**: Export as high-quality PNG or optimized JPEG.

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), and Modern JavaScript.
- **Engine**: High-performance HTML5 Canvas processing.
- **Backend**: Google Apps Script (GAS) for web hosting and AI proxying.
- **AI Integration**: Gemini 2.0 & Replicate API.

## 🚀 Deployment (Google Apps Script)

This project is optimized to run as a **Google Apps Script Web App**.

1. Create a new Google Apps Script project.
2. Copy the content of the following local files:
   - `Code.gs` → `Code.gs`
   - `index.html` → `index.html`
   - `Styles.html` → `Styles.html`
   - `Studio.html` → `Studio.html`
   - `Javascript.html` → `Javascript.html`
3. **Important**: Open `Code.gs` and insert your own API keys:
   ```javascript
   const REPLICATE_API_KEY = 'your_key_here';
   const GOOGLE_API_KEY = 'your_key_here';
   ```
4. Deploy as a Web App (Set access to "Anyone").

## 💻 Local Development

For faster UI iteration, you can run the local build script:

```bash
python3 build-local.py
```
This generates a single `local-dev.html` file that you can open directly in any modern browser.

## 📄 License

MIT © [Ilan Lenzner](https://github.com/ilanlenzner-design)
