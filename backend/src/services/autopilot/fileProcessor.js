const fs = require('fs').promises;
const path = require('path');

/**
 * Process uploaded file for AI vision analysis
 * @param {Object} file - Multer file object
 * @returns {Object} - Processed file data for Claude API
 */
async function processFileForAI(file) {
  if (!file) {
    return null;
  }

  try {
    // Read file as buffer
    const fileBuffer = await fs.readFile(file.path);
    const base64Data = fileBuffer.toString('base64');

    // Determine media type
    let mediaType;
    const ext = path.extname(file.originalname).toLowerCase();

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mediaType = 'image/jpeg';
        break;
      case '.png':
        mediaType = 'image/png';
        break;
      case '.gif':
        mediaType = 'image/gif';
        break;
      case '.webp':
        mediaType = 'image/webp';
        break;
      case '.pdf':
        mediaType = 'application/pdf';
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }

    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: base64Data
      }
    };
  } catch (error) {
    console.error('Error processing file for AI:', error);
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

/**
 * Process multiple files for AI analysis
 * @param {Array} files - Array of multer file objects
 * @returns {Array} - Array of processed file data
 */
async function processMultipleFilesForAI(files) {
  if (!files || files.length === 0) {
    return [];
  }

  const processedFiles = [];
  for (const file of files) {
    try {
      const processed = await processFileForAI(file);
      if (processed) {
        processedFiles.push(processed);
      }
    } catch (error) {
      console.error(`Error processing file ${file.originalname}:`, error);
      // Continue with other files
    }
  }

  return processedFiles;
}

/**
 * Delete uploaded file(s) after processing
 * @param {Object|Array} files - File or array of files to delete
 */
async function cleanupFiles(files) {
  const fileArray = Array.isArray(files) ? files : [files];

  for (const file of fileArray) {
    if (file && file.path) {
      try {
        await fs.unlink(file.path);
      } catch (error) {
        console.error(`Error deleting file ${file.path}:`, error);
      }
    }
  }
}

/**
 * Extract text description from uploaded file for context
 * @param {Object} file - Multer file object
 * @returns {String} - Text description of the file
 */
function getFileDescription(file) {
  if (!file) {
    return '';
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

  if (ext === '.pdf') {
    return `PDF document: ${file.originalname} (${sizeInMB}MB)`;
  } else {
    return `Image file: ${file.originalname} (${sizeInMB}MB, ${ext.substring(1).toUpperCase()})`;
  }
}

module.exports = {
  processFileForAI,
  processMultipleFilesForAI,
  cleanupFiles,
  getFileDescription
};
