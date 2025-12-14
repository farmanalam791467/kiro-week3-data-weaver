// Image Editor Main Script
class ImageEditor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.originalImage = null;
        this.history = [];
        this.historyStep = 0;
        this.adjustments = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            hue: 0,
            scale: 100,
            rotation: 0
        };
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    setupCanvas() {
        const container = document.getElementById('canvasContainer');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.canvas.style.display = 'none';
        container.appendChild(this.canvas);
    }

    setupEventListeners() {
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Update value displays
        ['brightness', 'contrast', 'saturation', 'hue', 'scale'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    document.getElementById(id + 'Value').textContent = e.target.value;
                });
            }
        });

        document.getElementById('filterIntensity').addEventListener('input', (e) => {
            document.getElementById('intensityValue').textContent = e.target.value;
        });
    }

    setupDragAndDrop() {
        const container = document.getElementById('canvasContainer');
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.style.background = '#efefef';
        });

        container.addEventListener('dragleave', () => {
            container.style.background = '#f5f5f5';
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.style.background = '#f5f5f5';
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.loadImage(files[0]);
            }
        });
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.resetAdjustments();
                this.renderImage();
                document.getElementById('canvasContainer').style.background = 'white';
                this.canvas.style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    resetAdjustments() {
        this.adjustments = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            hue: 0,
            scale: 100,
            rotation: 0
        };
        
        // Reset sliders
        ['brightness', 'contrast', 'saturation', 'hue', 'scale'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = id === 'scale' ? 100 : 0;
            document.getElementById(id + 'Value').textContent = element?.value || 0;
        });

        this.history = [];
        this.historyStep = 0;
    }

    renderImage() {
        if (!this.originalImage) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context
        this.ctx.save();

        // Apply scale transformation
        const scale = this.adjustments.scale / 100;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.ctx.translate(centerX, centerY);
        this.ctx.scale(scale, scale);
        this.ctx.rotate((this.adjustments.rotation * Math.PI) / 180);
        this.ctx.translate(-centerX, -centerY);

        // Draw image
        this.ctx.drawImage(this.originalImage, 0, 0);

        // Apply color adjustments
        this.applyColorAdjustments();

        // Restore context
        this.ctx.restore();

        this.saveToHistory();
    }

    applyColorAdjustments() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            let a = data[i + 3];

            // Brightness
            if (this.adjustments.brightness !== 0) {
                r += (this.adjustments.brightness * 2.55);
                g += (this.adjustments.brightness * 2.55);
                b += (this.adjustments.brightness * 2.55);
            }

            // Contrast
            if (this.adjustments.contrast !== 0) {
                const factor = (259 * (this.adjustments.contrast + 255)) / (255 * (259 - this.adjustments.contrast));
                r = factor * (r - 128) + 128;
                g = factor * (g - 128) + 128;
                b = factor * (b - 128) + 128;
            }

            // Saturation and Hue
            if (this.adjustments.saturation !== 0 || this.adjustments.hue !== 0) {
                [r, g, b] = this.adjustHSL(r, g, b, this.adjustments.hue, this.adjustments.saturation);
            }

            // Clamp values
            data[i] = Math.min(255, Math.max(0, r));
            data[i + 1] = Math.min(255, Math.max(0, g));
            data[i + 2] = Math.min(255, Math.max(0, b));
            data[i + 3] = a;
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    adjustHSL(r, g, b, hue, saturation) {
        // Convert RGB to HSL
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        // Apply adjustments
        h = (h + hue / 360) % 1;
        s = Math.min(1, s + saturation / 100);

        // Convert back to RGB
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;

        let r2 = 0, g2 = 0, b2 = 0;
        const h6 = h * 6;

        if (h6 < 1) [r2, g2, b2] = [c, x, 0];
        else if (h6 < 2) [r2, g2, b2] = [x, c, 0];
        else if (h6 < 3) [r2, g2, b2] = [0, c, x];
        else if (h6 < 4) [r2, g2, b2] = [0, x, c];
        else if (h6 < 5) [r2, g2, b2] = [x, 0, c];
        else [r2, g2, b2] = [c, 0, x];

        return [
            (r2 + m) * 255,
            (g2 + m) * 255,
            (b2 + m) * 255
        ];
    }

    saveToHistory() {
        this.history = this.history.slice(0, this.historyStep);
        this.history.push(this.canvas.toDataURL());
        this.historyStep++;
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.restoreFromHistory();
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.restoreFromHistory();
        }
    }

    restoreFromHistory() {
        const imageData = this.history[this.historyStep];
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
    }

    downloadImage(format) {
        const link = document.createElement('a');
        link.href = this.canvas.toDataURL(`image/${format}`);
        link.download = `edited-image-${Date.now()}.${format}`;
        link.click();
    }

    rotate(degrees) {
        this.adjustments.rotation += degrees;
        this.renderImage();
    }

    flip(direction) {
        this.ctx.save();
        if (direction === 'horizontal') {
            this.ctx.scale(-1, 1);
            this.ctx.translate(-this.canvas.width, 0);
        } else {
            this.ctx.scale(1, -1);
            this.ctx.translate(0, -this.canvas.height);
        }
        this.ctx.drawImage(this.originalImage, 0, 0);
        this.ctx.restore();

        // Update original image
        const newImg = new Image();
        newImg.onload = () => {
            this.originalImage = newImg;
            this.renderImage();
        };
        newImg.src = this.canvas.toDataURL();
    }

    applyScale(value) {
        this.adjustments.scale = value;
        this.renderImage();
    }

    resetImage() {
        this.resetAdjustments();
        if (this.originalImage) {
            this.renderImage();
        }
    }
}

// Initialize editor
const editor = new ImageEditor();

// Global functions for HTML onclick handlers
function applyAdjustment(type, value) {
    editor.adjustments[type] = parseInt(value);
    editor.renderImage();
}

function applyFilter(filterName) {
    if (!editor.originalImage) return;

    const imageData = editor.ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    const data = imageData.data;
    const intensity = parseInt(document.getElementById('filterIntensity').value) / 100;

    const filters = {
        grayscale: () => {
            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
                data[i] = data[i] * (1 - intensity) + gray * intensity;
                data[i + 1] = data[i + 1] * (1 - intensity) + gray * intensity;
                data[i + 2] = data[i + 2] * (1 - intensity) + gray * intensity;
            }
        },
        sepia: () => {
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                data[i] = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189) * intensity + r * (1 - intensity));
                data[i + 1] = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168) * intensity + g * (1 - intensity));
                data[i + 2] = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131) * intensity + b * (1 - intensity));
            }
        },
        invert: () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
        },
        blur: () => {
            // Simple box blur
            for (let i = 0; i < 3; i++) {
                applyBoxBlur(imageData, editor.canvas.width, editor.canvas.height);
            }
        },
        sharpen: () => {
            applySharpen(imageData, editor.canvas.width, editor.canvas.height);
        },
        edge: () => {
            applySobelEdgeDetection(imageData, editor.canvas.width, editor.canvas.height);
        },
        vintage: () => {
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                data[i] = Math.min(255, r + 30 * intensity);
                data[i + 1] = Math.min(255, g + 10 * intensity);
                data[i + 2] = Math.max(0, b - 20 * intensity);
            }
        },
        cool: () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.max(0, data[i] - 20 * intensity);
                data[i + 1] = Math.min(255, data[i + 1] + 10 * intensity);
                data[i + 2] = Math.min(255, data[i + 2] + 20 * intensity);
            }
        }
    };

    if (filters[filterName]) {
        filters[filterName]();
        editor.ctx.putImageData(imageData, 0, 0);
        editor.saveToHistory();
    }
}

function applyBoxBlur(imageData, width, height) {
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    const radius = 1;

    for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
            let r = 0, g = 0, b = 0, count = 0;

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const i = ((y + dy) * width + (x + dx)) * 4;
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }
            }

            const i = (y * width + x) * 4;
            output[i] = r / count;
            output[i + 1] = g / count;
            output[i + 2] = b / count;
        }
    }

    data.set(output);
}

function applySharpen(imageData, width, height) {
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let r = 0, g = 0, b = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const i = ((y + ky) * width + (x + kx)) * 4;
                    const k = (ky + 1) * 3 + (kx + 1);
                    r += data[i] * kernel[k];
                    g += data[i + 1] * kernel[k];
                    b += data[i + 2] * kernel[k];
                }
            }

            const i = (y * width + x) * 4;
            output[i] = Math.min(255, Math.max(0, r));
            output[i + 1] = Math.min(255, Math.max(0, g));
            output[i + 2] = Math.min(255, Math.max(0, b));
        }
    }

    data.set(output);
}

function applySobelEdgeDetection(imageData, width, height) {
    const data = imageData.data;
    const gray = new Uint8ClampedArray(width * height);

    // Convert to grayscale first
    for (let i = 0; i < data.length; i += 4) {
        gray[i / 4] = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
    }

    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0, gy = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const i = (y + ky) * width + (x + kx);
                    const k = (ky + 1) * 3 + (kx + 1);
                    gx += gray[i] * sobelX[k];
                    gy += gray[i] * sobelY[k];
                }
            }

            const magnitude = Math.sqrt(gx * gx + gy * gy);
            const idx = (y * width + x) * 4;
            data[idx] = magnitude;
            data[idx + 1] = magnitude;
            data[idx + 2] = magnitude;
        }
    }
}

function updateIntensity(value) {
    // Intensity slider updates the filter intensity value
}

function applyScale(value) {
    document.getElementById('scaleValue').textContent = value;
    editor.applyScale(value);
}

function rotate(degrees) {
    editor.rotate(degrees);
}

function flip(direction) {
    editor.flip(direction);
}

function undo() {
    editor.undo();
}

function redo() {
    editor.redo();
}

function resetImage() {
    editor.resetImage();
}

function downloadImage(format) {
    editor.downloadImage(format);
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}
