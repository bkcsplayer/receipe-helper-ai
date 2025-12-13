import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

const { Decimal } = Prisma;
const toDecimal = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return new Decimal(0);
  return new Decimal(value);
};

export const monthKeyFromDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export async function saveReceiptToDatabase(payload) {
  const {
    legacyId,
    storeName,
    storeLocation,
    category,
    transactionDate,
    totalAmount,
    taxAmount,
    currency = 'USD',
    source = 'WEB',
    status = 'completed',
    fileUrl,
    sheetRowId,
    distanceKm,
    meta,
    rawPayload,
    vehicleId,
    items = []
  } = payload;

  return prisma.receipt.upsert({
    where: legacyId ? { legacyId } : { id: 'noop' },
    update: {
      storeName,
      storeLocation,
      category,
      transactionDate: new Date(transactionDate ?? Date.now()),
      totalAmount: toDecimal(totalAmount ?? 0),
      taxAmount: toDecimal(taxAmount ?? 0),
      currency,
      source,
      status,
      fileUrl,
      sheetRowId,
      distanceKm: distanceKm ? toDecimal(distanceKm) : null,
      meta,
      rawPayload,
      vehicleId
    },
    create: {
      legacyId: legacyId ?? undefined,
      storeName,
      storeLocation,
      category,
      transactionDate: new Date(transactionDate ?? Date.now()),
      totalAmount: toDecimal(totalAmount ?? 0),
      taxAmount: toDecimal(taxAmount ?? 0),
      currency,
      source,
      status,
      fileUrl,
      sheetRowId,
      distanceKm: distanceKm ? toDecimal(distanceKm) : null,
      meta,
      rawPayload,
      vehicleId,
      items: {
        create: items.map((item) => ({
          name: item.name || 'Item',
          category: item.category,
          quantity: item.quantity ? toDecimal(item.quantity) : null,
          unitPrice: item.unit_price ? toDecimal(item.unit_price) : item.unitPrice ? toDecimal(item.unitPrice) : null,
          totalPrice: item.totalPrice ? toDecimal(item.totalPrice) : item.price ? toDecimal(item.price) : null,
          isEstimated: Boolean(item.is_estimated ?? item.isEstimated),
          tags: item.tags || []
        }))
      }
    }
  });
}

export async function listReceipts({ 
  page = 1, 
  pageSize = 20, 
  month, 
  category: filterCategory,
  startDate,
  endDate,
  storeName,
  source,
  type
}) {
  const skip = (page - 1) * pageSize;
  const where = {};
  
  // Date range filtering - supports either month OR startDate/endDate
  if (startDate && endDate) {
    where.transactionDate = {
      gte: new Date(`${startDate}T00:00:00Z`),
      lte: new Date(`${endDate}T23:59:59Z`)
    };
  } else if (month) {
    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where.transactionDate = { gte: start, lt: end };
  }
  
  // Additional filters
  if (filterCategory) {
    where.category = filterCategory;
  }
  if (storeName) {
    where.storeName = { contains: storeName, mode: 'insensitive' };
  }
  if (source) {
    where.source = source;
  }
  if (type) {
    where.type = type;
  }

  const [total, rows] = await Promise.all([
    prisma.receipt.count({ where }),
    prisma.receipt.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      skip,
      take: pageSize,
      include: { items: true }
    })
  ]);

  return {
    total,
    page,
    pageSize,
    data: rows
  };
}

export function getReceiptById(id) {
  return prisma.receipt.findUnique({
    where: { id },
    include: { items: true }
  });
}

