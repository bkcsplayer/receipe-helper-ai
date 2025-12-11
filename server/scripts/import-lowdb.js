import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lowdbPath = path.resolve(__dirname, '..', 'db.json');

async function importReceipts() {
  if (!fs.existsSync(lowdbPath)) {
    console.error(`⚠️ LowDB file not found at ${lowdbPath}`);
    return;
  }

  const raw = fs.readFileSync(lowdbPath, 'utf-8');
  const parsed = JSON.parse(raw);
  const receipts = parsed?.receipts || [];

  console.log(`📥 Importing ${receipts.length} receipts from LowDB...`);

  for (const receipt of receipts) {
    const monthKey = receipt.date?.slice(0, 7);

    const normalizedSource = (() => {
      const rawSource = (receipt.source || '').toLowerCase();
      if (rawSource.includes('email')) return 'EMAIL';
      if (rawSource.includes('web')) return 'WEB';
      if (rawSource.includes('telegram')) return 'TELEGRAM';
      return 'API';
    })();

    await prisma.receipt.upsert({
      where: { legacyId: String(receipt.id) },
      update: {
        storeName: receipt.store_name || 'Unknown Store',
        storeLocation: receipt.store_location,
        transactionDate: new Date(receipt.date || Date.now()),
        totalAmount: receipt.total_amount ?? 0,
        taxAmount: receipt.tax_amount ?? 0,
        category: receipt.category,
        source: normalizedSource,
        status: receipt.status || 'completed',
        fileUrl: receipt.driveLink,
        meta: {},
        rawPayload: receipt
      },
      create: {
        legacyId: String(receipt.id),
        storeName: receipt.store_name || 'Unknown Store',
        storeLocation: receipt.store_location,
        transactionDate: new Date(receipt.date || Date.now()),
        totalAmount: receipt.total_amount ?? 0,
        taxAmount: receipt.tax_amount ?? 0,
        category: receipt.category,
        source: normalizedSource,
        status: receipt.status || 'completed',
        fileUrl: receipt.driveLink,
        meta: { monthKey },
        rawPayload: receipt,
        items: {
          create: (receipt.items || []).map((item) => ({
            name: item.name || 'Item',
            totalPrice: item.price ?? 0
          }))
        }
      }
    });
  }

  console.log('✅ Import complete');
}

importReceipts()
  .catch((err) => {
    console.error('❌ Import failed', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

