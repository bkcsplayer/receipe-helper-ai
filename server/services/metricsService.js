import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { monthKeyFromDate } from './receiptService.js';

const fuelKeywords = ['fuel', 'gas', 'gasoline', 'petrol', 'diesel'];
const maintenanceKeywords = ['maintenance', 'repair', 'service', 'oil', 'tire', 'brake'];

const isMatch = (value = '', keywords = []) => {
  const lower = value.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
};

const categorizeReceipt = (receipt) => {
  if (receipt.category) {
    const lc = receipt.category.toLowerCase();
    if (lc.includes('fuel') || lc.includes('gas')) return 'fuel';
    if (lc.includes('maint') || lc.includes('repair')) return 'maintenance';
  }
  if (receipt.items?.length) {
    if (receipt.items.some((item) => isMatch(item.name || '', fuelKeywords))) return 'fuel';
    if (receipt.items.some((item) => isMatch(item.name || '', maintenanceKeywords))) return 'maintenance';
  }
  return 'general';
};

export function getMonthRange(monthKey) {
  const start = new Date(`${monthKey}-01T00:00:00Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

export async function computeMonthlyMetrics(targetMonth) {
  const monthKey = targetMonth || monthKeyFromDate(new Date());
  const { start, end } = getMonthRange(monthKey);

  const receipts = await prisma.receipt.findMany({
    where: {
      transactionDate: { gte: start, lt: end }
    },
    include: { items: true }
  });

  if (!receipts.length) {
    return [];
  }

  const totals = receipts.reduce(
    (acc, receipt) => {
      const total = Number(receipt.totalAmount || 0);
      acc.totalSpend += total;
      acc.taxTotal += Number(receipt.taxAmount || 0);
      acc.receiptCount += 1;
      acc.merchants[receipt.storeName || 'Unknown'] = (acc.merchants[receipt.storeName || 'Unknown'] || 0) + total;

      const category = categorizeReceipt(receipt);
      if (category === 'fuel') {
        acc.fuelSpend += total;
        acc.fuelCount += 1;
      }
      if (category === 'maintenance') {
        acc.maintenanceSpend += total;
        acc.maintenanceCount += 1;
      }
      if (receipt.distanceKm) {
        acc.distance += Number(receipt.distanceKm);
      }

      return acc;
    },
    {
      totalSpend: 0,
      taxTotal: 0,
      receiptCount: 0,
      merchants: {},
      fuelSpend: 0,
      fuelCount: 0,
      maintenanceSpend: 0,
      maintenanceCount: 0,
      distance: 0
    }
  );

  const metrics = [
    {
      metricKey: 'total_spend_month',
      valueNumeric: totals.totalSpend,
      unit: 'currency'
    },
    {
      metricKey: 'tax_total_month',
      valueNumeric: totals.taxTotal,
      unit: 'currency'
    },
    {
      metricKey: 'avg_receipt_amount',
      valueNumeric: totals.receiptCount ? totals.totalSpend / totals.receiptCount : 0,
      unit: 'currency'
    },
    {
      metricKey: 'fuel_cost_per_100km',
      valueNumeric: totals.distance > 0 ? (totals.fuelSpend / totals.distance) * 100 : null,
      unit: 'currency_per_100km'
    },
    {
      metricKey: 'maintenance_cost_per_100km',
      valueNumeric: totals.distance > 0 ? (totals.maintenanceSpend / totals.distance) * 100 : null,
      unit: 'currency_per_100km'
    },
    {
      metricKey: 'top_merchants',
      valueJson: Object.entries(totals.merchants)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount }))
    }
  ];

  await Promise.all(
    metrics.map((metric) =>
      prisma.metricMonthly.upsert({
        where: {
          month_metricKey: {
            month: monthKey,
            metricKey: metric.metricKey
          }
        },
        update: {
          valueNumeric:
            metric.valueNumeric === null || metric.valueNumeric === undefined
              ? null
              : new Prisma.Decimal(metric.valueNumeric),
          valueJson: metric.valueJson ?? null,
          unit: metric.unit ?? null
        },
        create: {
          month: monthKey,
          metricKey: metric.metricKey,
          valueNumeric:
            metric.valueNumeric === null || metric.valueNumeric === undefined
              ? null
              : new Prisma.Decimal(metric.valueNumeric),
          valueJson: metric.valueJson ?? null,
          unit: metric.unit ?? null
        }
      })
    )
  );

  return metrics;
}

export async function getMetrics(monthKey) {
  const effectiveMonth = monthKey || monthKeyFromDate(new Date());
  return prisma.metricMonthly.findMany({
    where: { month: effectiveMonth },
    orderBy: { metricKey: 'asc' }
  });
}

