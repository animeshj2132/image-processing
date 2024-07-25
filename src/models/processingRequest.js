import mongoose from 'mongoose';

const processingRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['received', 'processing', 'completed', 'error'],
    },
    processedData: [
      {
        serialNumber: { type: Number, unique: true },
        productName: String,
        inputImageUrls: [String],
        outputImageUrls: [String],
      },
    ],
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model('ProcessingRequest', processingRequestSchema);
