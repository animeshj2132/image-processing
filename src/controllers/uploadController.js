import csvParser from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { pipeline } from 'stream/promises';
import axios from 'axios';
import sharp from 'sharp';
import ProcessingRequest from '../models/processingRequest.js';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const expectedHeaders = ['S. No.', 'Product Name', 'Image Urls'];

// Controller for handling file upload
export async function uploadFile(req, res) {
  try {
    // Check if a file is uploaded
    if (!req.files || !req.files.csv) {
      return res
        .status(400)
        .send({ status: false, message: 'No file uploaded.' });
    }

    const csvFile = req.files.csv;
    const fileExtension = csvFile.name.split('.').pop();

    // Validate file extension
    if (fileExtension !== 'csv') {
      return res.status(400).send({
        status: false,
        message: 'Invalid file type. Please upload a CSV file.',
      });
    }

    // Check for temporary file path
    if (!csvFile.tempFilePath) {
      return res
        .status(400)
        .send({ status: false, message: 'Temporary file path is missing.' });
    }

    // Read the file content
    const fileContent = await fsPromises.readFile(
      csvFile.tempFilePath,
      'utf-8',
    );
    const rows = [];
    let headersValid = false;

    // Function to parse CSV file
    const parseCsv = () => {
      return new Promise((resolve, reject) => {
        Readable.from(fileContent)
          .pipe(csvParser())
          .on('headers', (headers) => {
            headersValid = expectedHeaders.every((header) =>
              headers.includes(header),
            );

            if (!headersValid) {
              return reject(
                new Error(
                  `Invalid CSV format. Headers do not match expected format. Found headers: ${headers.join(
                    ', ',
                  )}`,
                ),
              );
            }
          })
          .on('data', (data) => {
            if (!headersValid) return;

            if (
              !data['S. No.'] ||
              !data['Product Name'] ||
              !data['Image Urls']
            ) {
              return reject(
                new Error('Invalid CSV format. Missing required fields.'),
              );
            }

            const urls = data['Image Urls'].split(',');
            const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
            if (!urls.every((url) => urlPattern.test(url))) {
              return reject(
                new Error('Invalid CSV format. Invalid URLs in Image Urls.'),
              );
            }

            rows.push(data);
          })
          .on('end', resolve)
          .on('error', reject);
      });
    };

    // Parse the CSV file
    await parseCsv();

    // Create a new processing request
    const requestId = uuidv4();
    const processingRequest = new ProcessingRequest({
      requestId,
      status: 'received',
      processedData: [],
    });

    // Save the initial processing request to the database
    await processingRequest.save();
    await triggerWebhook(requestId);

    // Update status to 'processing'
    await ProcessingRequest.updateOne({ requestId }, { status: 'processing' });
    await triggerWebhook(requestId);

    // Process images in the background
    processImages(requestId, rows);

    // Return requestId immediately after validation
    return res.status(201).send({ status: true, requestId });
  } catch (error) {
    console.log('Error:', error.message);
    return res.status(500).send({ status: false, message: error.message });
  }
}

// Function to process images
const processImages = async (requestId, results) => {
  try {
    for (const row of results) {
      const images = row['Image Urls'].split(',');
      const compressedImages = [];

      // Compress each image
      for (const imageUrl of images) {
        const compressedImage = await compressImage(imageUrl);
        compressedImages.push(compressedImage);
      }

      // Update processed data in the database
      await ProcessingRequest.updateOne(
        { requestId },
        {
          $push: {
            processedData: {
              serialNumber: row['S. No.'],
              productName: row['Product Name'],
              inputImageUrls: images,
              outputImageUrls: compressedImages,
            },
          },
        },
      );
    }

    // Update status to 'completed'
    await ProcessingRequest.updateOne({ requestId }, { status: 'completed' });

    // Trigger the webhook
    await triggerWebhook(requestId);
  } catch (error) {
    console.error('Error processing images:', error.message);
    await ProcessingRequest.updateOne(
      { requestId },
      { status: 'error', errorMessage: error.message },
    );
  }
};

// Function to compress an image
const compressImage = async (url) => {
  if (url.startsWith('http')) {
    const response = await axios({ url, responseType: 'stream' });
    const compressedImageUrl = `compressed-${uuidv4()}.jpg`;

    await pipeline(
      response.data,
      sharp().resize(800, 600, { fit: 'inside' }).jpeg({ quality: 50 }),
      fs.createWriteStream(compressedImageUrl),
    );

    return compressedImageUrl;
  } else {
    const inputPath = url;
    const outputPath = inputPath.replace('image', 'image-compressed');

    await sharp(inputPath)
      .resize(800, 600, { fit: 'inside' })
      .jpeg({ quality: 50 })
      .toFile(outputPath);

    return outputPath;
  }
};

// Function to trigger a webhook
const triggerWebhook = async (requestId) => {
  try {
    const webhookUrl = process.env.WEBHOOK_URL;
    const processingRequest = await ProcessingRequest.findOne({ requestId });

    if (!processingRequest) {
      throw new Error('Processing request not found.');
    }

    const payload = {
      requestId: processingRequest.requestId,
      status: processingRequest.status,
      processedData: processingRequest.processedData,
    };

    await axios.post(webhookUrl, payload);
  } catch (error) {
    console.error('Error triggering webhook:', error.message);
  }
};

// Controller for getting the status of a processing request
export async function getStatus(req, res) {
  try {
    const { requestId } = req.params;

    const processingRequest = await ProcessingRequest.findOne({ requestId });

    if (!processingRequest) {
      return res
        .status(404)
        .send({ status: false, message: 'Request not found.' });
    }

    return res.status(200).send({
      status: true,
      data: {
        status: processingRequest.status,
        processedData: processingRequest.processedData,
        errorMessage: processingRequest.errorMessage,
      },
    });
  } catch (error) {
    console.log('Error:', error.message);
    return res.status(500).send({ status: false, message: error.message });
  }
}
