import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MONTHS = ['2025-10', '2025-11', '2025-12'];

const CATEGORIES = [
  'Dining', 'Groceries', 'Fuel', 'Maintenance', 'Lodging',
  'Subscriptions', 'Utilities', 'Tolls & Parking', 'Misc'
];

const STORES = {
  Dining: ['Starbucks', 'McDonalds', 'Chipotle', 'Local Diner', 'Uber Eats'],
  Groceries: ['Whole Foods', 'Walmart', 'Costco', 'Trader Joes', 'Kroger'],
  Fuel: ['Shell', 'BP', 'Exxon', 'Chevron', 'Wawa'],
  Maintenance: ['AutoZone', 'Jiffy Lube', 'Dealer Service', 'Tire Kingdom'],
  Lodging: ['Marriott', 'Airbnb', 'Hilton', 'Motel 6'],
  Subscriptions: ['Netflix', 'Spotify', 'Adobe', 'AWS', 'Google One'],
  Utilities: ['Electric Co', 'Water Dept', 'Comcast', 'Verizon'],
  'Tolls & Parking': ['EZPass', 'City Parking', 'Airport Garage'],
  Misc: ['Amazon', 'Target', 'Best Buy', 'CVS']
};

// Product names for each category (for item generation)
const PRODUCTS = {
  Dining: ['Latte', 'Burger', 'Burrito Bowl', 'Breakfast Special', 'Delivery Fee', 'Tip'],
  Groceries: ['Organic Milk', 'Bread', 'Chicken Breast', 'Mixed Greens', 'Coffee Beans', 'Eggs', 'Cheese', 'Orange Juice'],
  Fuel: ['Regular Gas', 'Premium Gas', 'Diesel', 'Car Wash'],
  Maintenance: ['Oil Filter', 'Wiper Blades', 'Oil Change', 'Tire Rotation', 'Brake Pad', 'Coolant'],
  Lodging: ['Room Charge', 'Resort Fee', 'Parking', 'Room Service'],
  Subscriptions: ['Monthly Subscription', 'Annual Plan', 'Premium Tier'],
  Utilities: ['Electric Bill', 'Gas Bill', 'Water Bill', 'Internet Service'],
  'Tolls & Parking': ['Toll Fee', 'Parking Fee', 'EZPass Reload'],
  Misc: ['Electronics', 'Home Goods', 'Personal Care', 'Medicine', 'Office Supplies']
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

async function main() {
  console.log('🌱 Starting Mock Data Seeding...');

  // 1. Clean up old mock data
  console.log('🧹 Cleaning old mock data...');
  try {
    await prisma.receiptItem.deleteMany({ where: { receipt: { meta: { path: ['isMock'], equals: true } } } });
    await prisma.receipt.deleteMany({ where: { meta: { path: ['isMock'], equals: true } } });
    await prisma.metricMonthly.deleteMany({ where: { month: { in: MONTHS } } });
    await prisma.analysisReport.deleteMany({ where: { month: { in: MONTHS } } });
    await prisma.emailJob.deleteMany({ where: { month: { in: MONTHS } } });
  } catch (e) {
    console.warn('Cleanup warning (might be empty):', e.message);
  }

  // 2. Generate Data for each month
  for (const month of MONTHS) {
    console.log(`📅 Generating data for ${month}...`);
    const [year, mon] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();

    let monthTotal = 0;
    let fuelSpend = 0;
    let maintenanceSpend = 0;
    let distanceTotal = 0;
    const merchantMap = {};
    const categoryMap = {};

    // Create Receipts
    const numReceipts = getRandomInt(20, 30);
    for (let i = 0; i < numReceipts; i++) {
      const category = getRandom(CATEGORIES);
      const store = getRandom(STORES[category]);
      const day = getRandomInt(1, daysInMonth);
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const transactionDate = new Date(dateStr);
      
      // Add random time to transaction date
      transactionDate.setHours(getRandomInt(8, 22), getRandomInt(0, 59), 0);
      
      // receivedAt can be same day or up to 3 days later (simulating email delay)
      const receivedDelay = getRandom([0, 0, 0, 1, 1, 2, 3]); // Most are same-day
      const receivedAt = new Date(transactionDate);
      receivedAt.setDate(receivedAt.getDate() + receivedDelay);
      receivedAt.setHours(getRandomInt(9, 23), getRandomInt(0, 59), 0);
      
      const amount = getRandomFloat(10, 200);
      const isFuel = category === 'Fuel';
      const isMaint = category === 'Maintenance';
      const source = getRandom(['WEB', 'EMAIL', 'EMAIL', 'TELEGRAM']); // More email receipts
      const type = getRandom(['EXPENSE', 'EXPENSE', 'EXPENSE', 'EXPENSE', 'INCOME']); // Mostly expenses
      
      let distance = null;
      if (isFuel) distance = getRandomFloat(300, 500);
      if (isMaint) distance = getRandomFloat(5000, 10000);

      monthTotal += type === 'INCOME' ? -amount : amount;
      if (isFuel) { fuelSpend += amount; distanceTotal += distance || 0; }
      if (isMaint) { maintenanceSpend += amount; distanceTotal += distance || 0; }
      
      merchantMap[store] = (merchantMap[store] || 0) + amount;
      categoryMap[category] = (categoryMap[category] || 0) + amount;

      // Generate items with some AI estimates
      const numItems = getRandomInt(1, 4);
      const items = [];
      let remainingAmount = amount;
      
      for (let j = 0; j < numItems; j++) {
        const isLast = j === numItems - 1;
        const productName = getRandom(PRODUCTS[category] || ['Item']);
        const qty = isLast ? 1 : getRandomInt(1, 3);
        const unitPrice = isLast ? remainingAmount : getRandomFloat(2, remainingAmount / 2);
        const totalPrice = isLast ? remainingAmount : parseFloat((unitPrice * qty).toFixed(2));
        remainingAmount -= totalPrice;
        
        // About 20% of items are AI estimated
        const isEstimated = Math.random() < 0.2;
        
        items.push({
          name: isEstimated ? `${productName} (approx)` : productName,
          category: category,
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          isEstimated: isEstimated
        });
      }

      await prisma.receipt.create({
        data: {
          storeName: store,
          storeLocation: 'Mock City, USA',
          category: category,
          transactionDate: transactionDate,
          receivedAt: receivedAt,
          totalAmount: amount,
          taxAmount: parseFloat((amount * 0.08).toFixed(2)),
          currency: 'USD',
          status: 'completed',
          source: source,
          type: type,
          meta: { isMock: true, monthKey: month },
          distanceKm: distance,
          items: {
            create: items
          }
        }
      });
    }

    // Create Metrics
    const metrics = [
      { key: 'total_spend_month', val: Math.abs(monthTotal), unit: 'currency' },
      { key: 'fuel_cost_per_100km', val: distanceTotal > 0 ? (fuelSpend / distanceTotal) * 100 : 0, unit: 'currency_per_100km' },
      { key: 'maintenance_cost_per_100km', val: distanceTotal > 0 ? (maintenanceSpend / distanceTotal) * 100 : 0, unit: 'currency_per_100km' },
    ];

    const topMerchants = Object.entries(merchantMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
      
    await prisma.metricMonthly.createMany({
      data: [
        ...metrics.map(m => ({
          month,
          metricKey: m.key,
          valueNumeric: m.val,
          unit: m.unit
        })),
        {
          month,
          metricKey: 'top_merchants',
          valueJson: topMerchants,
          unit: 'json'
        }
      ]
    });

    // Create Analysis Report
    const spendingBreakdown = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    const topCategory = Object.keys(categoryMap).reduce((a, b) => categoryMap[a] > categoryMap[b] ? a : b, Object.keys(categoryMap)[0]);

    await prisma.analysisReport.create({
      data: {
        month,
        model: 'mock-ai',
        summaryText: `In ${month}, you spent a total of $${Math.abs(monthTotal).toFixed(2)}. Top spending category was ${topCategory}. Fuel efficiency looks stable. Mock data analysis complete.`,
        recommendations: [
          { title: 'Optimize Fuel', detail: 'Consider using rewards apps for Shell.', recommended_action: 'Join Rewards' },
          { title: 'Subscription Check', detail: 'You have multiple recurring charges.', recommended_action: 'Audit Subs' },
          { title: 'Dining Out', detail: `Dining expenses are higher than usual in ${topCategory === 'Dining' ? 'this month' : 'general'}.`, recommended_action: 'Cook More' }
        ],
        vehicleInsights: { fuel_efficiency: '8.5L/100km', maintenance_status: 'Good' },
        spendingBreakdown: spendingBreakdown
      }
    });

    // Email Job Mock
    await prisma.emailJob.create({
        data: {
            month,
            status: 'sent',
            sentAt: new Date()
        }
    });
  }

  console.log('✅ Mock Seed Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
