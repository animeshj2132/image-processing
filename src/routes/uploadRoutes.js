import express from 'express';
import { uploadFile, getStatus } from '../controllers/uploadController.js';

const router = express.Router();

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload CSV file
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csv:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 requestId:
 *                   type: string
 *       400:
 *         description: No file uploaded or invalid format
 *       500:
 *         description: Internal server error
 */
router.post('/upload', uploadFile);

/**
 * @swagger
 * /status/{requestId}:
 *   get:
 *     summary: Get processing status
 *     parameters:
 *       - in: path
 *         name: requestId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the request
 *     responses:
 *       200:
 *         description: Successfully retrieved status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: completed
 *                     processedData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           serialNumber:
 *                             type: string
 *                           productName:
 *                             type: string
 *                           inputImageUrls:
 *                             type: array
 *                             items:
 *                               type: string
 *                           outputImageUrls:
 *                             type: array
 *                             items:
 *                               type: string
 *       404:
 *         description: Request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Request not found.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/status/:requestId', getStatus);

export default router;
