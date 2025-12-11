import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import cron from 'node-cron';
import { google } from 'googleapis';
import { Readable } from 'stream';
import TelegramBot from 'node-telegram-bot-api';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { saveReceiptToDatabase, listReceipts as listReceiptsV2, getReceiptById } from './services/receiptService.js';
import { computeMonthlyMetrics, getMetrics } from './services/metricsService.js';
import { generateMonthlyAnalysis, getAnalysisReport } from './services/analysisService.js';
import { sendMonthlyReportEmail } from './services/emailService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Database Setup (Local Persistence) ---
const adapter = new JSONFile(path.join(process.cwd(), 'db.json'));
const db = new Low(adapter, { receipts: [] }); // Default data

async function initDB() {
  await db.read();
  db.data ||= { receipts: [] };
  await db.write();
}
initDB();

// --- Telegram Setup ---
let bot = null;
if (process.env.TELEGRAM_BOT_TOKEN) {
  // Disable Polling for now, use simple send-only mode to fix connection errors
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  console.log('🤖 Telegram Bot Initialized (Send Only)');
}

async function sendTelegramNotify(message) {
  // Check both bot instance and CHAT_ID
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!bot) {
    console.log('⚠️ Telegram Bot instance not initialized (check TOKEN)');
    return;
  }
  
  if (!chatId) {
    console.log('⚠️ Telegram CHAT_ID missing in .env');
    return;
  }

  try {
    console.log(`📨 Sending Telegram to ${chatId}...`);
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log('✅ Telegram Notification Sent');
  } catch (err) {
    console.error('❌ Telegram Send Failed:', err.code || err.message);
    
    // Specific handling for "Chat not found" - usually means user hasn't started the bot
    if (err.response && err.response.body && err.response.body.description === 'Bad Request: chat not found') {
      console.error('   👉 ACTION REQUIRED: Please open your bot in Telegram and click "Start"');
    } else if (err.response && err.response.body) {
      console.error('   Telegram API Response:', err.response.body);
    }
  }
}

// Initialize Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/cloud-platform' // Added Cloud Platform scope for Storage
  ],
});

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

// --- Cloudflare R2 (S3-compatible) ---
const r2Config = {
  endpoint: process.env.R2_ENDPOINT?.replace(/\/$/, ''),
  region: process.env.R2_REGION || 'auto',
  bucket: process.env.R2_BUCKET_NAME,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  publicBaseUrl: process.env.R2_PUBLIC_DOMAIN?.replace(/\/$/, ''),
  prefix: process.env.R2_UPLOAD_PATH ? process.env.R2_UPLOAD_PATH.replace(/^\/|\/$/g, '') : '',
};

let r2Client = null;
if (
  r2Config.endpoint &&
  r2Config.bucket &&
  r2Config.accessKeyId &&
  r2Config.secretAccessKey
) {
  r2Client = new S3Client({
    region: r2Config.region,
    endpoint: r2Config.endpoint,
    credentials: {
      accessKeyId: r2Config.accessKeyId,
      secretAccessKey: r2Config.secretAccessKey,
    },
    forcePathStyle: true,
  });
}

const isR2Enabled = () => Boolean(r2Client);

const buildMonthFolder = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const buildR2Key = (fileName, dateStr) => {
  const segments = [];
  if (r2Config.prefix) {
    segments.push(r2Config.prefix);
  }
  const monthFolder = buildMonthFolder(dateStr || new Date().toISOString());
  if (monthFolder) {
    segments.push(monthFolder);
  }
  segments.push(fileName);
  return segments.filter(Boolean).join('/');
};

async function uploadToR2(fileBuffer, mimeType, fileName, dateStr) {
  if (!isR2Enabled()) throw new Error("Cloudflare R2 not configured");
  const objectKey = buildR2Key(fileName, dateStr);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2Config.bucket,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: mimeType || 'application/octet-stream',
    })
  );
  return r2Config.publicBaseUrl ? `${r2Config.publicBaseUrl}/${encodeURI(objectKey)}` : null;
}

// Middleware
app.use(cors());
app.use(express.json());

// --- SSE Setup (Server-Sent Events) ---
let clients = [];

function sendProgress(data) {
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

const serializeReceipt = (receipt) => ({
  ...receipt,
  totalAmount: Number(receipt.totalAmount ?? 0),
  taxAmount: Number(receipt.taxAmount ?? 0),
  distanceKm: receipt.distanceKm ? Number(receipt.distanceKm) : null,
  items: (receipt.items || []).map((item) => ({
    ...item,
    quantity: item.quantity ? Number(item.quantity) : null,
    unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
    totalPrice: item.totalPrice ? Number(item.totalPrice) : null
  }))
});

app.get('/api/progress', (req, res) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  console.log(`📡 Client connected for progress updates: ${clientId}`);

  req.on('close', () => {
    console.log(`📡 Client disconnected: ${clientId}`);
    clients = clients.filter(client => client.id !== clientId);
  });
});

// --- OpenRouter Helper ---
async function analyzeReceiptWithOpenRouter(fileBuffer, mimeType) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OpenRouter Key missing");

  const base64Image = fileBuffer.toString('base64');

  try {
    console.log("🧠 Sending image to OpenRouter...");
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a receipt scanner API. Extract data from this image.
              Return ONLY valid JSON. No markdown formatting, no notes.
              Required JSON Structure:
              {
                "store_name": "string",
                "store_location": "string",
                "date": "YYYY-MM-DD",
                "total_amount": number,
                "tax_amount": number,
                "items": [
                  { "name": "string", "price": number }
                ]
              }
              Rules:
              1. If date is missing, use "${new Date().toISOString().split('T')[0]}".
              2. If tax is not shown, use 0.
              3. If location (city/branch) is not shown, use "Unknown".
              4. total_amount MUST be a number (e.g. 12.50), do NOT include '$'.
              5. If the image is blurry or not a receipt (e.g. logos, signatures, promotional banners), return {"error": "not_a_receipt"}.
              6. These images often come from email attachments; ignore loyalty cards or marketing graphics unless they clearly contain itemized totals.`
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            }
          ]
        }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://receipt-manifestation.app",
      }
    });

    let content = response.data.choices[0].message.content;
    console.log("🧠 Raw AI Response:", content); // Debug Log

    // Sanitize: Remove markdown blocks if present
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(content);
    
    // Validation
    if (data.error) throw new Error("AI could not recognize receipt");
    if (!data.store_name) data.store_name = "Unknown Store";
    if (!data.total_amount) data.total_amount = 0;

    return data;

  } catch (error) {
    console.error("OpenRouter Error:", error.response?.data || error.message);
    throw error;
  }
}

async function analyzeEmailReceiptWithOpenRouter({ htmlContent, attachments }) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OpenRouter Key missing");

  const emailHtml = htmlContent || 'No email body provided.';
  const limitedAttachments = (attachments || []).slice(0, 3);

  const contentBlocks = [
    {
      type: "text",
      text: `You are a receipt scanner AI. Your task is to read the following EMAIL HTML + optional attachments and return ONLY a JSON object that matches this schema:
{
  "store_name": "string",
  "store_location": "string",
  "date": "YYYY-MM-DD",
  "total_amount": number,
  "tax_amount": number,
  "items": [
    { "name": "string", "price": number }
  ]
}
Rules:
1. store_location should include address/city/state if available.
2. total_amount is the final paid amount.
3. tax_amount is the tax portion (0 if unknown).
4. items can be a short list (max 5) covering the most relevant line items.
5. If you cannot find a receipt, respond exactly {"error":"not_a_receipt"}.
6. Do NOT include any other fields; no merchant/phone/time unless mapped into the schema above.

--- EMAIL HTML START ---
${emailHtml}
--- EMAIL HTML END ---`
    }
  ];

  limitedAttachments.forEach((att, idx) => {
    contentBlocks.push({
      type: "image_url",
      image_url: {
        url: `data:${att.mimeType};base64,${att.base64}`,
        detail: "auto"
      }
    });
  });

  try {
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "user",
          content: contentBlocks
        }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://receipt-manifestation.app",
      }
    });

    let content = response.data.choices[0].message.content;
    console.log("🧠 Raw AI Response (email):", content);
    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(content);

    if (data.error) throw new Error("AI could not recognize receipt from email");

    // Normalize fields using fallback values if model deviates
    data.store_name ||= data.merchant || data.store || "Unknown Store";
    data.store_location ||= data.address || data.store_location || "";
    data.date ||= data.transaction_date || new Date().toISOString().split('T')[0];
    data.total_amount = Number(data.total_amount ?? data.total ?? data.amount ?? 0);
    data.tax_amount = Number(data.tax_amount ?? data.tax ?? 0);
    if (!Array.isArray(data.items) || data.items.length === 0) {
      data.items = (Array.isArray(data.line_items) ? data.line_items : []).slice(0, 5).map(item => ({
        name: item.name || item.description || "Item",
        price: Number(item.price || item.amount || 0)
      }));
      if (data.items.length === 0) {
        data.items = [{ name: "General Purchase", price: data.total_amount || 0 }];
      }
    } else {
      data.items = data.items.map(item => ({
        name: item.name || item.description || "Item",
        price: Number(item.price || item.amount || 0)
      }));
    }

    return data;
  } catch (error) {
    console.error("OpenRouter Email Error:", error.response?.data || error.message);
    throw error;
  }
}

// --- Google Drive Helper (Robust) ---
let monthFolderCache = {}; 

async function getOrCreateMonthFolder(dateStr) {
  // Parse date correctly even if YYYY-MM-DD is messy
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return process.env.GOOGLE_DRIVE_FOLDER_ID; // Fallback to root

  const monthName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  
  if (monthFolderCache[monthName]) return monthFolderCache[monthName];

  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  
  try {
    // 1. Search
    const q = `mimeType='application/vnd.google-apps.folder' and name='${monthName}' and '${rootFolderId}' in parents and trashed=false`;
    const res = await drive.files.list({ q, fields: 'files(id, name)' });

    if (res.data.files.length > 0) {
      const folderId = res.data.files[0].id;
      monthFolderCache[monthName] = folderId;
      console.log(`[Drive] Found existing folder: ${monthName} (${folderId})`);
      return folderId;
    }

    // 2. Create
    console.log(`📂 Creating new Drive folder: ${monthName} in ${rootFolderId}`);
    const folderMetadata = {
      name: monthName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId]
    };
    const newFolder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    const newId = newFolder.data.id;
    monthFolderCache[monthName] = newId;
    return newId;
  } catch (err) {
    console.error("⚠️ Drive Folder Error:", err.message);
    return rootFolderId; // Fallback to root if create fails
  }
}

async function uploadToGoogleDrive(fileBuffer, mimeType, fileName, dateStr) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) throw new Error("Google Auth missing");

  console.log(`[Drive] Starting upload for ${fileName}...`);
  const targetFolderId = await getOrCreateMonthFolder(dateStr || new Date().toISOString());
  console.log(`[Drive] Target Folder ID: ${targetFolderId}`);

  const fileMetadata = {
    name: fileName,
    parents: [targetFolderId],
  };

  const media = {
    mimeType: mimeType,
    body: Readable.from(fileBuffer),
  };

  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, name',
      supportsAllDrives: true,
    });
    console.log(`[Drive] Upload Success! File ID: ${response.data.id}, Name: ${response.data.name}`);
    return response.data.webViewLink;
  } catch (error) {
    console.error("[Drive] Upload Failed:", error.message);
    
    if (error.message.includes('storage quota')) {
      console.warn("⚠️  GOOGLE DRIVE QUOTA ERROR: Service Accounts on personal Gmail have 0GB quota.");
      console.warn("    -> Files cannot be uploaded directly via Service Account ownership.");
      console.warn("    -> Skipping Drive upload, but continuing to Sheets/Telegram.");
      return null;
    }
    
    throw error;
  }
}

async function archiveEvidence(fileBuffer, mimeType, fileName, dateStr) {
  if (isR2Enabled()) {
    console.log(`[R2] Starting upload for ${fileName}...`);
    return uploadToR2(fileBuffer, mimeType, fileName, dateStr);
  }

  return uploadToGoogleDrive(fileBuffer, mimeType, fileName, dateStr);
}

// --- Google Sheets Helper (Robust Header Check) ---
async function getOrCreateMonthSheet(dateStr) {
  const date = new Date(dateStr);
  const sheetTitle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    // 1. Check if sheet exists
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    let sheet = meta.data.sheets.find(s => s.properties.title === sheetTitle);

    if (!sheet) {
      console.log(`📊 Creating new Sheet tab: ${sheetTitle}`);
      const addRes = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests: [{ addSheet: { properties: { title: sheetTitle } } }] }
      });
      const replies = addRes.data?.replies || [];
      sheet = replies[0]?.addSheet?.properties;
    }

    if (!sheet) {
      throw new Error(`Failed to obtain properties for sheet ${sheetTitle}`);
    }

    // 2. FORCE Check Header: Read A1
    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A1`
    });

    // If A1 is empty or doesn't match 'Date', write header
    if (!headerCheck.data.values || headerCheck.data.values[0][0] !== 'Date') {
      console.log(`📝 Writing Headers to ${sheetTitle}...`);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A1:H1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['Date', 'Store Name', 'Item Name', 'Price', 'Tax', 'Total Amount', 'Source', 'Link']]
        }
      });
    }
    
    return { title: sheetTitle, id: sheet.sheetId };

  } catch (err) {
    console.error("⚠️ Sheet Error:", err.message);
    throw err;
  }
}

async function appendToSheet(data, fileLink, source = 'Web') {
  if (!process.env.GOOGLE_SHEET_ID) throw new Error("Sheet ID missing");
  
  const { title: sheetTitle, id: sheetId } = await getOrCreateMonthSheet(data.date || new Date().toISOString());
  
  let rows = [];
  
  if (data.items && data.items.length > 0) {
    rows = data.items.map((item, idx) => [
      data.date,
      data.store_name,
      item.name,
      item.price,
      idx === 0 ? data.tax_amount : '',
      idx === 0 ? data.total_amount : '',
      source,
      idx === 0 ? fileLink : ''
    ]);
  } else {
    rows = [[
      data.date,
      data.store_name,
      "General Purchase",
      data.total_amount,
      data.tax_amount,
      data.total_amount,
      source,
      fileLink
    ]];
  }

  let appendRes;
  try {
    appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${sheetTitle}!A:H`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });
  } catch (appendError) {
    console.error('❌ Sheets append failed:', appendError.message);
    throw appendError;
  }

  const updates = appendRes?.data?.updates;
  if (!updates) return;

  const totalRows = rows.length;
  const firstRowIndex = updates.updatedRange
    ? parseInt(updates.updatedRange.match(/!(?:[A-Z]+)(\d+)/)?.[1] || '2', 10) - 1
    : updates.updatedRows
      ? updates.updatedRows - totalRows
      : 1;
  const lastRowIndex = firstRowIndex + totalRows;

  // Apply background color based on source (Email vs Camera) in best-effort mode
  const isEmail = source === 'Email';
  const backgroundColor = isEmail
    ? { red: 0.85, green: 0.90, blue: 1 }
    : { red: 1, green: 0.95, blue: 0.8 };

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: firstRowIndex,
                endRowIndex: lastRowIndex,
                startColumnIndex: 0,
                endColumnIndex: 8,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor,
                },
              },
              fields: 'userEnteredFormat.backgroundColor',
            },
          },
        ],
      },
    });
  } catch (colorError) {
    console.warn('⚠️ Sheet color update failed (non-blocking):', colorError.message);
  }
}

// --- Health Check Logic ---
async function checkSystemHealth() {
  const status = {
    ai: { ok: false, msg: '' },
    drive: { ok: false, msg: '' },
    sheets: { ok: false, msg: '' },
    email: { ok: false, msg: '' },
    telegram: { ok: false, msg: '' }
  };

  // 1. Check AI
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.startsWith('sk-')) {
    status.ai = { ok: true, msg: 'Key Configured' };
  } else {
    status.ai = { ok: false, msg: 'Key Missing' };
  }

  // 2. Check Archive Target (Cloudflare R2 preferred, fallback to Google Drive)
  if (isR2Enabled()) {
    status.drive = { ok: true, msg: 'Cloudflare R2 Ready' };
  } else if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
    status.drive = { ok: true, msg: 'Drive Fallback' };
  } else {
    status.drive = { ok: false, msg: 'Archive Config Missing' };
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    if (process.env.GOOGLE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
      status.sheets = { ok: true, msg: 'Sheets Auth Configured' };
    } else {
      status.sheets = { ok: false, msg: 'Invalid Key Format' };
    }
  } else {
    status.sheets = { ok: false, msg: 'Sheets Auth Missing' };
  }

  // 3. Check Email (Try simple connection test if possible, or just config check)
  if (process.env.IMAP_USER && process.env.IMAP_PASSWORD) {
    status.email = { ok: true, msg: 'Configured' };
  } else {
    status.email = { ok: false, msg: 'Missing Config' };
  }

  // 4. Check Telegram
  if (bot && process.env.TELEGRAM_CHAT_ID) {
    status.telegram = { ok: true, msg: 'Bot Ready' };
  } else {
    status.telegram = { ok: false, msg: 'Not Configured' };
  }

  return status;
}

// --- Email Check Logic ---
const RECEIPT_ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/octet-stream' // some providers send images as generic binary
]);

const RECEIPT_ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'gif', 'pdf']);

const RECEIPT_BLOCKED_KEYWORDS = ['logo', 'signature', 'sig', 'banner', 'footer', 'icon', 'facebook', 'linkedin', 'twitter'];

const getMimeType = (part = {}) => {
  const major = (part.type || '').toLowerCase();
  const minor = (part.subtype || part.params?.subtype || part.params?.type || '').toLowerCase();
  if (major && minor) return `${major}/${minor}`;
  return major || '';
};

const getFileExtension = (fileName = '') => {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  return match ? match[1] : '';
};

const isReceiptLikeMeta = ({ mimeType, fileName } = {}) => {
  mimeType = (mimeType || '').toLowerCase();
  const nameLower = (fileName || '').toLowerCase();
  const ext = getFileExtension(fileName);

  const mimeAllowed = mimeType && RECEIPT_ALLOWED_MIME.has(mimeType);
  const extAllowed = ext && RECEIPT_ALLOWED_EXT.has(ext);

  if (!mimeAllowed && !extAllowed) return false;

  if (nameLower && RECEIPT_BLOCKED_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
    return false;
  }

  return true;
};

const isReceiptLikeAttachment = (part = {}) => {
  return isReceiptLikeMeta({
    mimeType: getMimeType(part),
    fileName: part.params?.name || part.params?.fileName || part.params?.id || ''
  });
};

async function checkEmails() {
  if (!process.env.IMAP_USER || !process.env.IMAP_PASSWORD) return;

  const config = {
    imap: {
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASSWORD,
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT) || 993,
      tls: process.env.IMAP_TLS !== 'false', // Default to true unless explicitly 'false'
      authTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false } // Often needed for self-signed certs on custom domains
    }
  };

  let connection;
  try {
    console.log(`📧 Connecting to Email (${config.imap.host}:${config.imap.port})...`);
    connection = await imaps.connect(config);
    await connection.openBox('INBOX');
    console.log('✅ Email Connected Successfully');

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], struct: true, markSeen: true };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    if (messages.length === 0) {
      console.log('📭 No new emails found.');
      connection.end();
      return;
    }

    console.log(`📬 Found ${messages.length} new emails! Processing...`);

    for (const message of messages) {
      const rawBodyPart = message.parts?.find(part => part.which === '');
      const rawEmail = rawBodyPart?.body;
      if (!rawEmail) {
        console.warn('⚠️ Email skipped: no raw body found.');
        continue;
      }

      let parsed;
      try {
        parsed = await simpleParser(rawEmail);
      } catch (parseErr) {
        console.error('❌ Failed to parse email:', parseErr.message);
        continue;
      }

      const emailHtml = parsed.html || parsed.textAsHtml || parsed.text || 'No content';
      const parserAttachments = (parsed.attachments || []);
      const receiptAttachments = parserAttachments
        .filter(att => isReceiptLikeMeta({ mimeType: att.contentType, fileName: att.filename }))
        .map(att => ({
          mimeType: att.contentType || 'image/jpeg',
          base64: att.content.toString('base64'),
          buffer: att.content,
          fileName: att.filename || `email_inline_${Date.now()}.bin`
        }));

      console.log(`📎 Email parsed. Attachment candidates: ${receiptAttachments.length}`);

      let data;
      try {
        data = await analyzeEmailReceiptWithOpenRouter({
          htmlContent: emailHtml,
          attachments: receiptAttachments
        });
        data.source = "Email";
      } catch (aiErr) {
        console.error('❌ Email AI analysis failed:', aiErr.message);
        continue;
      }

      const emailArchiveLabel = isR2Enabled() ? 'Cloudflare R2' : 'Google Drive';
      let archiveBuffer = receiptAttachments[0]?.buffer;
      let archiveMime = receiptAttachments[0]?.mimeType || 'text/html';
      let archiveName = receiptAttachments[0]?.fileName || `email_${Date.now()}.html`;

      if (!archiveBuffer) {
        archiveBuffer = Buffer.from(emailHtml, 'utf-8');
        archiveMime = 'text/html';
        archiveName = `email_${Date.now()}.html`;
      }

      let driveLink = null;
      try {
        driveLink = await archiveEvidence(archiveBuffer, archiveMime, archiveName, data.date);
        console.log(`✅ Email evidence archived to ${emailArchiveLabel}: ${driveLink}`);
      } catch (archiveErr) {
        console.warn(`⚠️ Email archive failed (${emailArchiveLabel}):`, archiveErr.message);
      }

      try {
        await appendToSheet(data, driveLink, "Email");
      } catch (sheetErr) {
        console.warn('⚠️ Email ledger update failed:', sheetErr.message);
      }

      await db.read();
      const newRecord = { id: Date.now(), ...data, driveLink, status: 'completed' };
      db.data.receipts.push(newRecord);
      await db.write();

      try {
        await saveReceiptToDatabase({
          legacyId: String(newRecord.id),
          storeName: data.store_name || 'Unknown Store',
          storeLocation: data.store_location,
          category: data.category,
          transactionDate: data.date,
          totalAmount: Number(data.total_amount ?? 0),
          taxAmount: Number(data.tax_amount ?? 0),
          source: 'EMAIL',
          fileUrl: driveLink,
          rawPayload: data,
          meta: { channel: 'email' },
          items: (data.items || []).map((item) => ({
            name: item.name,
            totalPrice: Number(item.price ?? item.amount ?? 0),
            quantity: item.quantity
          }))
        });
      } catch (dbErr) {
        console.error('❌ Failed to persist receipt in Postgres:', dbErr.message);
      }
      console.log(`✅ Email Receipt Processed: ${data.store_name} - $${data.total_amount}`);

      const telegramMsg = `
✨ *Manifestation Complete!* (Email)

🏪 Store: ${data.store_name}
💰 Total: $${data.total_amount}
📅 Date: ${data.date}

✅ Archived to ${emailArchiveLabel}
✅ Recorded in Sheets
`;
      await sendTelegramNotify(telegramMsg);
    }
  } catch (error) {
    console.error('📧 IMAP Error:', error.message);
  } finally {
    if (connection) {
      try {
        connection.end();
      } catch (endErr) {
        console.warn('📧 IMAP end error:', endErr.message);
      }
    }
  }
}

// Schedule Email Check (repeating)
const startEmailWatcher = () => {
  const poll = async () => {
    try {
      await checkEmails();
    } catch (err) {
      console.error('📧 Email poll error:', err.message);
    } finally {
      // Poll every 15 seconds (default) to react faster to new receipts
      const interval = Number(process.env.EMAIL_POLL_INTERVAL_MS) || 15000;
      setTimeout(poll, interval);
    }
  };

  setTimeout(poll, 5000);
};

startEmailWatcher();

// Configure Multer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Routes
app.get('/api/health', async (req, res) => {
  const health = await checkSystemHealth();
  res.json(health);
});

// Get Receipt History
app.get('/api/receipts', async (req, res) => {
  await db.read();
  // Sort by date desc, then fallback to id (newest first) so recently uploaded receipts stay on top
  const sorted = db.data.receipts
    .slice()
    .sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) return dateDiff;
      return (b.id || 0) - (a.id || 0);
    });
  res.json(sorted);
});

// V2 Receipts (Postgres)
app.get('/api/v2/receipts', async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Math.min(Number(req.query.pageSize || 20), 100);
  const month = req.query.month;
  const category = req.query.category;

  try {
    const result = await listReceiptsV2({ page, pageSize, month, category });
    res.json({
      ...result,
      data: result.data.map(serializeReceipt)
    });
  } catch (err) {
    console.error('❌ Failed to fetch V2 receipts:', err.message);
    res.status(500).json({ error: 'Failed to fetch receipts', details: err.message });
  }
});

app.get('/api/v2/receipts/:id', async (req, res) => {
  try {
    const receipt = await getReceiptById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.json(serializeReceipt(receipt));
  } catch (err) {
    console.error('❌ Receipt fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch receipt', details: err.message });
  }
});

// Process Receipt Endpoint
app.post('/api/process-receipt', upload.single('receipt'), async (req, res) => {
  const archiveLabel = isR2Enabled() ? 'Cloudflare R2' : 'Google Drive';

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No evidence provided (file missing)' });
    }

    console.log('✨ Manifesting Receipt (Web):', req.file.originalname);
    sendProgress({ step: 1, message: "Uploading Receipt...", progress: 10 });
    
    let data;

    try {
      console.log('🔮 Consulting the Oracles (OpenRouter)...');
      sendProgress({ step: 2, message: "Consulting AI Oracle...", progress: 30 });
      
      data = await analyzeReceiptWithOpenRouter(req.file.buffer, req.file.mimetype);
      data.source = "Web Upload";
      
      sendProgress({ step: 2, message: "AI Analysis Complete", progress: 60 });
      console.log('✅ AI Manifestation Complete');
    } catch (aiError) {
      console.warn('⚠️ Oracle unavailable, using crystal ball (Mock Data):', aiError.message);
      // Fallback not allowed anymore for production-like behavior, throw error to stop
      throw aiError; 
    }

    let driveLink = null;
    try {
      console.log(`☁️ Uploading evidence to ${archiveLabel}...`);
      sendProgress({ step: 3, message: `Archiving to ${archiveLabel}...`, progress: 75 });
      
      // Sanitize filename parts
      const sanitize = (str) => (str || 'Unknown').toString().replace(/[^a-zA-Z0-9]/g, '_');
      const ext = path.extname(req.file.originalname) || '.jpg';
      const uniqueId = Date.now(); // Unique ID
      
      // Format: Date_Location_Store_Price_UniqueID
      const newFileName = `${data.date}_${sanitize(data.store_location)}_${sanitize(data.store_name)}_${data.total_amount}_${uniqueId}${ext}`;

      driveLink = await archiveEvidence(req.file.buffer, req.file.mimetype, newFileName, data.date);

      if (!driveLink && isR2Enabled()) {
        console.warn(`⚠️ ${archiveLabel} returned no public link (object stored without public URL).`);
      } else if (driveLink) {
        console.log(`✅ Evidence Archived to ${archiveLabel}: ${driveLink}`);
      }

    } catch (driveError) {
      console.warn(`⚠️ ${archiveLabel} unavailable (skipping):`, driveError.message);
      // Continue without link if archive fails
    }

    try {
      console.log('📝 Writing to the Ledger...');
      sendProgress({ step: 4, message: "Writing to Google Sheets...", progress: 90 });
      
      await appendToSheet(data, driveLink);
      console.log('✅ Ledger Updated');
    } catch (sheetError) {
      console.warn('⚠️ Ledger unavailable (skipping):', sheetError.message);
    }

    // 4. Save to Local DB + Postgres
    await db.read();
    const newRecord = {
      id: Date.now(),
      ...data,
      driveLink,
      status: 'completed'
    };
    db.data.receipts.push(newRecord);
    await db.write();

    try {
      await saveReceiptToDatabase({
        legacyId: String(newRecord.id),
        storeName: data.store_name || 'Unknown Store',
        storeLocation: data.store_location,
        category: data.category,
        transactionDate: data.date,
        totalAmount: Number(data.total_amount ?? 0),
        taxAmount: Number(data.tax_amount ?? 0),
        source: 'WEB',
        fileUrl: driveLink,
        rawPayload: data,
        meta: { channel: 'web' },
        items: (data.items || []).map((item) => ({
          name: item.name,
          totalPrice: Number(item.price ?? item.amount ?? 0),
          quantity: item.quantity
        }))
      });
    } catch (dbErr) {
      console.error('❌ Failed to persist receipt in Postgres:', dbErr.message);
    }

    // 5. Send Telegram Notification
    const telegramMsg = `
✨ *Manifestation Complete!*

🏪 Store: ${data.store_name}
💰 Total: $${data.total_amount}
📅 Date: ${data.date}

✅ Archived to ${archiveLabel}
✅ Recorded in Sheets
`;
    await sendTelegramNotify(telegramMsg);

    sendProgress({ step: 5, message: "Manifestation Complete! ✨", progress: 100 });

    res.json({
      success: true,
      message: 'Receipt manifested into reality',
      data: newRecord
    });

  } catch (error) {
    console.error('❌ Manifestation Error:', error);
    sendProgress({ step: -1, message: "Manifestation Failed", progress: 0 });
    
    // Send Error Notification
    await sendTelegramNotify(`❌ *Manifestation Failed*\nReason: ${error.message}`);
    
    res.status(500).json({ error: 'Cosmic interference detected', details: error.message });
  }
});

app.get('/api/v2/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics(req.query.month);
    res.json(metrics);
  } catch (err) {
    console.error('❌ Failed to fetch metrics:', err.message);
    res.status(500).json({ error: 'Metrics fetch failed', details: err.message });
  }
});

app.post('/api/v2/metrics/recompute', async (req, res) => {
  const month = req.body?.month || req.query?.month;
  try {
    const metrics = await computeMonthlyMetrics(month);
    res.json({ success: true, metrics });
  } catch (err) {
    console.error('❌ Metric recompute failed:', err.message);
    res.status(500).json({ error: 'Metric recompute failed', details: err.message });
  }
});

app.get('/api/v2/analysis', async (req, res) => {
  try {
    const report = await getAnalysisReport(req.query.month);
    res.json(report || {});
  } catch (err) {
    console.error('❌ Analysis fetch failed:', err.message);
    res.status(500).json({ error: 'Analysis fetch failed', details: err.message });
  }
});

app.post('/api/v2/analysis/generate', async (req, res) => {
  const month = req.body?.month || req.query?.month;
  try {
    const report = await generateMonthlyAnalysis(month);
    res.json({ success: true, report });
  } catch (err) {
    console.error('❌ Analysis generation failed:', err.message);
    res.status(500).json({ error: 'Analysis generation failed', details: err.message });
  }
});

app.post('/api/v2/email/send', async (req, res) => {
  const month = req.body?.month || req.query?.month;
  try {
    await sendMonthlyReportEmail(month);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    res.status(500).json({ error: 'Email send failed', details: err.message });
  }
});

// --- Startup Validation & Health Checks ---
async function validateConfig() {
  console.log('\n🔍 Validating Configuration...');
  let hasIssues = false;

  // 1. Check Telegram
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn('⚠️  TELEGRAM WARNING: Bot Token or Chat ID is missing in .env');
    console.warn('    -> Notifications will NOT be sent.');
    // Don't set hasIssues = true because this is optional
  }

  // 2. Check Google Auth Format (needed for Google Sheets)
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.error('❌ GOOGLE ERROR: Email or Private Key missing in .env');
    hasIssues = true;
  }

  // 3. Verify Archive Target
  if (isR2Enabled()) {
    console.log('🗄️ Cloudflare R2 archive mode enabled (S3-compatible).');
  } else if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
    try {
      console.log(`📂 Verifying access to Drive Folder: ${process.env.GOOGLE_DRIVE_FOLDER_ID}...`);
      await drive.files.get({
        fileId: process.env.GOOGLE_DRIVE_FOLDER_ID,
        fields: 'id, name, capabilities'
      });
      console.log('✅ Drive Access: OK');
    } catch (err) {
      console.error(`❌ DRIVE ACCESS ERROR: Could not access folder ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
      console.error('   -> PLEASE SHARE this folder with your Service Account Email:');
      console.error(`   -> ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
      console.error(`   -> Error details: ${err.message}`);
      hasIssues = true;
    }
  } else {
    console.error('❌ STORAGE ERROR: Neither Cloudflare R2 nor Google Drive fallback is configured.');
    hasIssues = true;
  }

  // 4. Verify Sheet Access
  try {
    console.log(`📊 Verifying access to Sheet: ${process.env.GOOGLE_SHEET_ID}...`);
    await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      fields: 'properties.title'
    });
    console.log('✅ Sheet Access: OK');
  } catch (err) {
    console.error(`❌ SHEET ACCESS ERROR: Could not access sheet ${process.env.GOOGLE_SHEET_ID}`);
    console.error('   -> PLEASE SHARE this sheet with your Service Account Email:');
    console.error(`   -> ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
    hasIssues = true;
  }

  console.log('----------------------------------------\n');
  return !hasIssues;
}

// Initialize DB and Start Server
initDB().then(() => {
  app.listen(PORT, async () => {
    console.log(`✨ Server manifesting on port ${PORT}`);
    await validateConfig(); // Run validation on start
  });
});
