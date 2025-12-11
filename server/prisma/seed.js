import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const indicatorBlueprints = [
  {
    metricKey: 'total_spend_month',
    label: 'Monthly Spend',
    description: 'Sum of all receipt totals for the month.',
    unit: 'currency',
    calculation: {
      type: 'aggregate',
      field: 'total_amount',
      op: 'sum'
    }
  },
  {
    metricKey: 'fuel_cost_per_100km',
    label: 'Fuel Cost / 100km',
    description: 'Average fuel spend for every 100 km driven.',
    unit: 'currency_per_100km',
    calculation: {
      type: 'custom',
      formula: '(fuel_spend / distance_km) * 100',
      requires: ['fuel_spend', 'distance_km']
    }
  },
  {
    metricKey: 'maintenance_cost_per_100km',
    label: 'Maintenance Cost / 100km',
    description: 'Average maintenance or repair spend normalized by distance.',
    unit: 'currency_per_100km',
    calculation: {
      type: 'custom',
      formula: '(maintenance_spend / distance_km) * 100',
      requires: ['maintenance_spend', 'distance_km']
    }
  },
  {
    metricKey: 'recurring_payments',
    label: 'Recurring Commitments',
    description: 'Subscriptions or repeating merchants detected by AI.',
    unit: 'count',
    calculation: {
      type: 'ai-detection',
      source: 'analysis_reports'
    }
  }
];

async function main() {
  console.log('🌱 Seeding baseline data...');

  await prisma.user.upsert({
    where: { email: 'owner@receipt.ai' },
    update: {},
    create: {
      email: 'owner@receipt.ai',
      name: 'Owner',
      role: 'owner'
    }
  });

  for (const indicator of indicatorBlueprints) {
    await prisma.indicatorDefinition.upsert({
      where: { metricKey: indicator.metricKey },
      update: {
        label: indicator.label,
        description: indicator.description,
        unit: indicator.unit,
        calculation: indicator.calculation
      },
      create: indicator
    });
  }

  console.log('✅ Seed complete');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

