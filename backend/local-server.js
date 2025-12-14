/**
 * Local Development Server
 * Simulates AWS API Gateway and Lambda for local testing
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../frontend/public')));

/**
 * Image Processing Endpoint
 * POST /api/process
 */
app.post('/api/process', async (req, res) => {
    try {
        const { imageData, operation, parameters } = req.body;

        if (!imageData || !operation) {
            return res.status(400).json({
                error: 'Missing required fields: imageData, operation'
            });
        }

        console.log(`Processing image with operation: ${operation}`);

        // Simulate processing
        const result = {
            statusCode: 200,
            message: 'Image processed successfully',
            operation,
            timestamp: new Date().toISOString()
        };

        res.json(result);
    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({
            error: 'Failed to process image',
            details: error.message
        });
    }
});

/**
 * Batch Processing Endpoint
 * POST /api/batch
 */
app.post('/api/batch', async (req, res) => {
    try {
        const { images, operations } = req.body;

        if (!Array.isArray(images) || !Array.isArray(operations)) {
            return res.status(400).json({
                error: 'Images and operations must be arrays'
            });
        }

        console.log(`Batch processing ${images.length} images with ${operations.length} operations`);

        const results = images.map(img => ({
            id: img.id,
            operations: operations.map(op => ({
                operation: op.operation,
                status: 'processed',
                timestamp: new Date().toISOString()
            }))
        }));

        res.json({
            statusCode: 200,
            message: 'Batch processing completed',
            totalImages: images.length,
            results
        });
    } catch (error) {
        console.error('Batch processing error:', error);
        res.status(500).json({
            error: 'Batch processing failed',
            details: error.message
        });
    }
});

/**
 * Health Check Endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Image Editor API',
        timestamp: new Date().toISOString()
    });
});

/**
 * Operations List Endpoint
 */
app.get('/api/operations', (req, res) => {
    res.json({
        operations: [
            'resize',
            'blur',
            'grayscale',
            'compress',
            'rotate',
            'watermark',
            'brightness',
            'contrast',
            'saturation',
            'edge-detection',
            'sharpen',
            'sepia'
        ]
    });
});

/**
 * Serve Frontend
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/editor.html'));
});

// Also serve the editor.js file
app.use('/src', express.static(path.join(__dirname, '../frontend/src')));

/**
 * Error Handler
 */
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║      🎨 Serverless Image Editor API is Running  🚀        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Dashboard: http://localhost:${PORT}                       ║
║  Editor: http://localhost:${PORT}/editor                   ║
║  API Health: http://localhost:${PORT}/api/health           ║
║  Operations: http://localhost:${PORT}/api/operations       ║
║                                                            ║
║  POST /api/process - Process single image                 ║
║  POST /api/batch - Batch process images                   ║
║                                                            ║
║  Press Ctrl+C to stop the server                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});
