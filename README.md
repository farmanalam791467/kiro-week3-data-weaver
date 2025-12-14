# Serverless Image Editor 🎨

A modern, serverless image editing application built with serverless architecture. Edit, filter, and transform images directly in your browser with the option to process heavy operations on AWS Lambda.

## 🎯 Features

### Frontend Features
- **Real-time Image Editing** with Canvas API
- **Image Filters**: Brightness, Contrast, Saturation, Blur, Grayscale, Sepia, etc.
- **Image Transformations**: Resize, Rotate, Flip, Crop
- **Effect Library**: Vintage, Sharpen, Edge Detection, Invert
- **Undo/Redo** functionality
- **Download** edited images in multiple formats
- **Drag & Drop** file upload
- **Before/After** comparison view

### Backend Features
- **AWS Lambda** integration for heavy processing
- **Serverless Processing** for batch operations
- **S3 Storage** integration ready
- **API Gateway** endpoints for backend operations

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, Canvas API
- **Backend**: Node.js, AWS Lambda, AWS API Gateway
- **Storage**: AWS S3 (optional)
- **Image Processing**: Sharp.js (Node backend)
- **Deployment**: AWS SAM / Serverless Framework

## 📁 Project Structure

```
kiro-week3-data-weaver/
├── .kiro/                          # Kiro AI acceleration artifacts
├── frontend/
│   ├── public/
│   │   ├── index.html              # Main dashboard
│   │   ├── editor.html             # Image editor
│   │   └── assets/
│   └── src/
│       ├── editor.js               # Editor logic
│       ├── filters.js              # Image filter library
│       └── ui.js                   # UI components
├── backend/
│   ├── functions/
│   │   ├── image-processor.js      # Lambda function
│   │   └── batch-processor.js      # Batch processing
│   ├── layers/
│   │   └── nodejs/                 # Lambda layers
│   └── template.yaml               # SAM template
├── package.json
├── README.md
└── .gitignore
```

## 🚀 Getting Started

### Prerequisites
- Node.js v14+
- AWS Account (for serverless deployment)
- AWS CLI configured

### Installation

```bash
# Clone or setup the repository
cd kiro-week3-data-weaver

# Install dependencies
npm install

# For backend development
cd backend && npm install

# For frontend development
cd ../frontend && npm install
```

### Running Locally

#### Frontend Only (Standalone)
```bash
cd frontend
npx http-server . -p 8000
```
Visit: `http://localhost:8000`

#### With Local Backend
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npx http-server . -p 8000
```

### Deploying to AWS

#### Using AWS SAM
```bash
cd backend
sam build
sam deploy --guided
```

#### Using Serverless Framework
```bash
cd backend
serverless deploy
```

## 📊 API Endpoints

### Local Development (http://localhost:3000)

#### Process Image
```bash
POST /api/process
Content-Type: application/json

{
  "imageData": "base64-encoded-image",
  "operation": "blur",
  "parameters": { "radius": 5 }
}
```

#### Get Supported Operations
```bash
GET /api/operations
```

#### Batch Process Images
```bash
POST /api/batch
Content-Type: application/json

{
  "images": [...],
  "operations": [...]
}
```

## 🎨 Available Filters & Effects

### Basic Adjustments
- Brightness
- Contrast
- Saturation
- Hue Rotation

### Blur Effects
- Blur
- Motion Blur
- Zoom Blur

### Color Operations
- Grayscale
- Sepia
- Invert
- Color Shift

### Advanced Effects
- Edge Detection
- Sharpen
- Emboss
- Oil Paint

### Transforms
- Resize
- Rotate (90°, 180°, 270°)
- Flip (Horizontal, Vertical)
- Crop

## 🔧 Development

### Adding New Filters

Edit `frontend/src/filters.js`:
```javascript
export function customFilter(imageData, parameters) {
  // Your filter logic here
  return modifiedImageData;
}
```

### Adding Lambda Functions

Create new file in `backend/functions/`:
```javascript
exports.handler = async (event) => {
  // Your serverless logic here
  return response;
};
```

## 📈 Performance Optimization

- **Canvas Rendering**: Real-time with WebWorkers (optional)
- **Image Compression**: Automatic optimization
- **Lazy Loading**: Load filters on demand
- **Caching**: Browser cache for repeated operations
- **Serverless Scale**: Lambda auto-scales for batch processing

## 🔐 Security

- CORS enabled for controlled origins
- Input validation on all endpoints
- File size limits enforced
- S3 bucket policies configured
- No sensitive data stored client-side

## 📝 Usage Examples

### Web UI
1. Open `frontend/public/index.html` in browser
2. Click "Choose Image" or drag & drop
3. Apply filters from the filter panel
4. Adjust parameters with sliders
5. Download the edited image

### Programmatic (API)
```javascript
const response = await fetch('http://localhost:3000/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageData: canvasElement.toDataURL(),
    operation: 'brightness',
    parameters: { amount: 20 }
  })
});
```

## 🚀 Deployment Checklist

- [ ] Configure AWS credentials
- [ ] Set environment variables
- [ ] Test all API endpoints
- [ ] Run load tests for Lambda functions
- [ ] Configure CloudWatch monitoring
- [ ] Set up auto-scaling policies
- [ ] Document API endpoints
- [ ] Create user documentation

## 📚 Learning Resources

- [AWS Lambda with Node.js](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
- [Canvas API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Sharp.js Image Processing](https://sharp.pixelplumbing.com/)
- [AWS SAM Getting Started](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)

## 🤝 Contributing

Contributions welcome! Please follow the code style and add tests for new features.

## 📄 License

MIT License - See LICENSE file for details

## 🎯 Kiro Challenge Submission

**Challenge**: Build a serverless image editing application
**Status**: Complete
**Technologies**: AWS Lambda, Canvas API, Node.js
**Deployment**: Ready for AWS

---

**Built with Kiro AI Acceleration** 🚀
Developed as part of the Kiro Week 3 Challenge
