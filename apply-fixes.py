#!/usr/bin/env python3
"""
Script to apply all remaining fixes to Studio.html
"""

with open('Studio.html', 'r') as f:
    content = f.read()

# Fix 1: Add transformation logic to applyImageAdjustments
old_apply = '''    // Image Adjustment Functions
    applyImageAdjustments() {
        if (!this.state.media) return;

        if (this.timers.adjustment) clearTimeout(this.timers.adjustment);
        this.timers.adjustment = setTimeout(() => {
            const ctx = this.els.sourceCanvas.getContext('2d');
            ctx.drawImage(this.state.media, 0, 0);

            const imageData = ctx.getImageData(0, 0, this.state.media.width, this.state.media.height);
            const data = imageData.data;

            const brightness = this.state.adjustments.brightness;
            const contrast = (this.state.adjustments.contrast / 100) + 1;
            const saturation = (this.state.adjustments.saturation / 100) + 1;

            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Apply brightness
                r += brightness;
                g += brightness;
                b += brightness;

                // Apply contrast
                r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
                g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
                b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

                // Apply saturation
                const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
                r = gray + (r - gray) * saturation;
                g = gray + (g - gray) * saturation;
                b = gray + (b - gray) * saturation;

                // Clamp values
                data[i] = Math.max(0, Math.min(255, r));
                data[i + 1] = Math.max(0, Math.min(255, g));
                data[i + 2] = Math.max(0, Math.min(255, b));
            }

            ctx.putImageData(imageData, 0, 0);
            this.refresh();
        }, 50);
    }'''

new_apply = '''    // Image Adjustment Functions
    applyImageAdjustments() {
        if (!this.state.media) return;

        if (this.timers.adjustment) clearTimeout(this.timers.adjustment);
        this.timers.adjustment = setTimeout(() => {
            const adj = this.state.adjustments;
            const img = this.state.media;
            const ctx = this.els.sourceCanvas.getContext('2d');
            
            // Handle rotation
            const rotation = adj.rotation || 0;
            const isRotated90 = (rotation === 90 || rotation === 270);
            
            if (isRotated90) {
                this.els.sourceCanvas.width = img.height;
                this.els.sourceCanvas.height = img.width;
                this.els.overlayCanvas.width = img.height;
                this.els.overlayCanvas.height = img.width;
            } else {
                this.els.sourceCanvas.width = img.width;
                this.els.sourceCanvas.height = img.height;
                this.els.overlayCanvas.width = img.width;
                this.els.overlayCanvas.height = img.height;
            }
            
            ctx.clearRect(0, 0, this.els.sourceCanvas.width, this.els.sourceCanvas.height);
            
            // Apply transformations
            ctx.save();
            ctx.translate(this.els.sourceCanvas.width / 2, this.els.sourceCanvas.height / 2);
            
            if (rotation) ctx.rotate(rotation * Math.PI / 180);
            
            const scaleX = adj.flipH ? -1 : 1;
            const scaleY = adj.flipV ? -1 : 1;
            ctx.scale(scaleX, scaleY);
            
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            ctx.restore();

            const imageData = ctx.getImageData(0, 0, this.els.sourceCanvas.width, this.els.sourceCanvas.height);
            const data = imageData.data;

            const brightness = adj.brightness;
            const contrast = (adj.contrast / 100) + 1;
            const saturation = (adj.saturation / 100) + 1;

            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Grayscale filter
                if (this.state.filterGrayscale) {
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    r = g = b = gray;
                }

                // Apply brightness
                r += brightness;
                g += brightness;
                b += brightness;

                // Apply contrast
                r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
                g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
                b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

                // Apply saturation
                const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
                r = gray + (r - gray) * saturation;
                g = gray + (g - gray) * saturation;
                b = gray + (b - gray) * saturation;

                // Invert filter
                if (this.state.filterInvert) {
                    r = 255 - r;
                    g = 255 - g;
                    b = 255 - b;
                }

                // Clamp values
                data[i] = Math.max(0, Math.min(255, r));
                data[i + 1] = Math.max(0, Math.min(255, g));
                data[i + 2] = Math.max(0, Math.min(255, b));
            }

            ctx.putImageData(imageData, 0, 0);
            this.refresh();
        }, 50);
    }'''

if old_apply in content:
    content = content.replace(old_apply, new_apply)
    print("✅ Applied transformation logic to applyImageAdjustments()")
else:
    print("❌ Could not find applyImageAdjustments() to replace")

# Write back
with open('Studio.html', 'w') as f:
    f.write(content)

print("Done!")
