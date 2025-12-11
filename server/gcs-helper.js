import { Storage } from '@google-cloud/storage';
import path from 'path';

// Your Service Account logic remains the same, we just use it for Storage now
const storage = new Storage({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.split('@')[1].split('.')[0] // Try to extract project ID or use default if set
});

// Hardcoded bucket name from user screenshot
const BUCKET_NAME = 'react-receipe-ai'; 

export async function uploadToGCS(fileBuffer, mimeType, fileName, dateStr) {
  try {
    console.log(`[GCS] Starting upload to bucket: ${BUCKET_NAME}`);
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Create a folder structure: YYYY-MM/filename
    const date = new Date(dateStr);
    const monthFolder = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const fullPath = `${monthFolder}/${fileName}`;
    
    const file = bucket.file(fullPath);

    // Upload file
    await file.save(fileBuffer, {
      metadata: { contentType: mimeType },
      resumable: false
    });

    console.log(`[GCS] Uploaded successfully: ${fullPath}`);

    // Make it public or generate a signed URL? 
    // Since user asked for "Link", let's generate a Signed URL valid for 7 days (max) or longer?
    // Or if the bucket is public-read (which the screenshot says "非公共" - Not Public), we need Signed URL.
    
    // Let's generate a Signed URL valid for 1 year (virtual permanent link for user)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 Year
    });

    return url;

  } catch (error) {
    console.error('[GCS] Upload Error:', error);
    throw error;
  }
}

