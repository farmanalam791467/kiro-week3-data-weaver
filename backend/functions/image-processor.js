/**
 * AWS Lambda Function for Image Processing
 * Handles serverless image processing operations
 */

const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

/**
 * Lambda Handler for image processing
 * 
 * Event structure:
 * {
 *   operation: 'resize' | 'blur' | 'grayscale' | 'compress',
 *   bucket: 'source-bucket',
 *   key: 'image-key',
 *   parameters: { width, height, quality, etc }
 * }
 */
exports.handler = async (event) => {
    console.log('Image processing request:', JSON.stringify(event, null, 2));

    try {
        const { operation, bucket, key, parameters } = event;

        // Validate input
        if (!operation || !bucket || !key) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Missing required parameters: operation, bucket, key'
                })
            };
        }

        // Get image from S3
        const imageObject = await s3.getObject({
            Bucket: bucket,
            Key: key
        }).promise();

        let processedImage = imageObject.Body;

        // Process based on operation
        switch (operation) {
            case 'resize':
                processedImage = await resizeImage(processedImage, parameters);
                break;
            case 'blur':
                processedImage = await blurImage(processedImage, parameters);
                break;
            case 'grayscale':
                processedImage = await grayscaleImage(processedImage);
                break;
            case 'compress':
                processedImage = await compressImage(processedImage, parameters);
                break;
            case 'rotate':
                processedImage = await rotateImage(processedImage, parameters);
                break;
            case 'watermark':
                processedImage = await addWatermark(processedImage, parameters);
                break;
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: `Unknown operation: ${operation}` })
                };
        }

        // Save processed image back to S3
        const outputKey = `processed/${Date.now()}-${key}`;
        await s3.putObject({
            Bucket: bucket,
            Key: outputKey,
            Body: processedImage,
            ContentType: 'image/jpeg'
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Image processed successfully',
                operation,
                outputKey,
                outputUrl: `s3://${bucket}/${outputKey}`
            })
        };

    } catch (error) {
        console.error('Error processing image:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to process image',
                details: error.message
            })
        };
    }
};

/**
 * Resize image to specified dimensions
 */
async function resizeImage(imageBuffer, parameters) {
    const { width, height, fit = 'cover' } = parameters;

    if (!width || !height) {
        throw new Error('Width and height are required for resize operation');
    }

    return sharp(imageBuffer)
        .resize(width, height, { fit, withoutEnlargement: true })
        .toBuffer();
}

/**
 * Apply blur effect to image
 */
async function blurImage(imageBuffer, parameters) {
    const { radius = 5 } = parameters;

    return sharp(imageBuffer)
        .blur(Math.min(radius, 50)) // Limit blur radius
        .toBuffer();
}

/**
 * Convert image to grayscale
 */
async function grayscaleImage(imageBuffer) {
    return sharp(imageBuffer)
        .grayscale()
        .toBuffer();
}

/**
 * Compress image to reduce file size
 */
async function compressImage(imageBuffer, parameters) {
    const { quality = 80, format = 'jpeg' } = parameters;

    let pipeline = sharp(imageBuffer);

    if (format === 'webp') {
        pipeline = pipeline.webp({ quality: Math.min(quality, 100) });
    } else {
        pipeline = pipeline.jpeg({ quality: Math.min(quality, 100), progressive: true });
    }

    return pipeline.toBuffer();
}

/**
 * Rotate image by specified degrees
 */
async function rotateImage(imageBuffer, parameters) {
    const { angle = 90 } = parameters;

    return sharp(imageBuffer)
        .rotate(angle % 360)
        .toBuffer();
}

/**
 * Add watermark to image
 */
async function addWatermark(imageBuffer, parameters) {
    const { watermarkPath, opacity = 0.5 } = parameters;

    if (!watermarkPath) {
        throw new Error('Watermark path is required');
    }

    // Get watermark from S3
    const watermarkObject = await s3.getObject({
        Bucket: parameters.watermarkBucket,
        Key: watermarkPath
    }).promise();

    return sharp(imageBuffer)
        .composite([{
            input: watermarkObject.Body,
            gravity: 'southeast',
            opacity: Math.min(opacity, 1)
        }])
        .toBuffer();
}

/**
 * Batch processing for multiple images
 */
exports.batchHandler = async (event) => {
    console.log('Batch processing request:', JSON.stringify(event, null, 2));

    try {
        const { images, operations } = event;

        if (!Array.isArray(images) || !Array.isArray(operations)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Images and operations must be arrays'
                })
            };
        }

        const results = [];

        for (const image of images) {
            for (const operation of operations) {
                try {
                    const result = await exports.handler({
                        ...operation,
                        bucket: image.bucket,
                        key: image.key
                    });
                    results.push({
                        imageKey: image.key,
                        operation: operation.operation,
                        status: 'success',
                        result: JSON.parse(result.body)
                    });
                } catch (error) {
                    results.push({
                        imageKey: image.key,
                        operation: operation.operation,
                        status: 'error',
                        error: error.message
                    });
                }
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Batch processing completed',
                totalImages: images.length,
                totalOperations: operations.length,
                results
            })
        };

    } catch (error) {
        console.error('Error in batch processing:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Batch processing failed',
                details: error.message
            })
        };
    }
};
