# Image Processing API

## Overview

This project provides an API for uploading a CSV file containing image URLs and associated product information. It processes the images by compressing them, stores the results in a MongoDB database, and triggers webhooks to notify about the processing status.

## Features

- **CSV File Upload**: Upload CSV files with image URLs and associated product information.
- **Asynchronous Image Processing**: Compress images by 50% of their original quality, running in the background to avoid blocking requests.
- **Webhook Notifications**: Receive real-time notifications when image processing is complete.
- **Status Check**: Query the processing status using a unique request ID, allowing you to check on the progress or results of the image processing.
- **Swagger Documentation**: Automatically generated API documentation for easy testing and understanding of the available endpoints.

## Technologies

- **Node.js**: JavaScript runtime for building server-side applications.
- **Express.js**: Web framework for Node.js that simplifies building robust APIs.
- **MongoDB**: NoSQL database for storing processing requests and results.
- **Sharp**: High-performance image processing library for Node.js used to resize and compress images.
- **Axios**: Promise-based HTTP client for making HTTP requests, used here for downloading images and sending webhook notifications.
- **CSV-Parser**: Streaming CSV parser for Node.js, used to read and validate the CSV file contents.

## Setup Instructions

### Prerequisites

- Node.js installed on your machine.
- A running instance of MongoDB.

### Installation

1. Clone the repository:
    ```sh
    git clone <repository-url>
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file with the following content:
    ```
    PORT=3001
    MONGODB_URL=mongodb://localhost:27017/yourdatabase
    WEBHOOK_URL=http://your-webhook-url.com
    ```

4. Start the server:
    ```sh
    npm start
    ```

## API Endpoints

### Upload CSV

- **URL:** `/upload`
- **Method:** `POST`
- **Description:** Uploads a CSV file for processing.
- **Request:**
    - `multipart/form-data` with a `csv` file field.
- **Response:**
    - `201 Created` with `requestId` indicating the request was accepted.
    - `400 Bad Request` for invalid file or missing file.
    - `500 Internal Server Error` for server errors.

### Get Status

- **URL:** `/status/{requestId}`
- **Method:** `GET`
- **Description:** Gets the processing status of a specific request.
- **Response:**
    - `200 OK` with processing status and data.
    - `404 Not Found` if request ID is invalid.
    - `500 Internal Server Error` for server errors.

## Swagger Documentation

Swagger documentation is available at `/api-docs`. This documentation provides an interactive interface to test the API endpoints and understand the request/response formats.

## Linting and Formatting

This project uses ESLint and Prettier for code linting and formatting. Configuration files for both tools are included in the repository.

### Run ESLint

```sh
npm run lint
