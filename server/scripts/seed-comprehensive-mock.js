/**
 * Comprehensive Mock Data Generator
 * 
 * Creates realistic personal finance data including:
 * - Paychecks (bi-weekly salary)
 * - Credit card transactions
 * - Bank statement entries
 * - Bills and recurring expenses
 * - Various expense categories
 * 
 * Run: npm run seed:comprehensive
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// ===== CONFIGURATION =====

const MONTHS_TO_GENERATE = 3; // Generate 3 months of data
const START_MONTH = new Date();
START_MONTH.setMonth(START_MONTH.getMonth() - MONTHS_TO_GENERATE + 1);

// Payment accounts configuration
const PAYMENT_ACCOUNTS = [
  { name: 'Chase Sapphire Preferred', type: 'credit_card', institution: 'Chase', last4: '4521', creditLimit: 15000, rewardsType: 'points', rewardsRate: '3x dining/travel, 1x other' },
  { name: 'Amex Gold', type: 'credit_card', institution: 'American Express', last4: '1008', creditLimit: 20000, rewardsType: 'points', rewardsRate: '4x dining, 4x groceries, 3x flights' },
  { name: 'Citi Double Cash', type: 'credit_card', institution: 'Citi', last4: '7733', creditLimit: 10000, rewardsType: 'cashback', rewardsRate: '2% on everything' },
  { name: 'Amazon Prime Visa', type: 'credit_card', institution: 'Chase', last4: '9012', creditLimit: 8000, rewardsType: 'cashback', rewardsRate: '5% Amazon, 2% dining/gas' },
  { name: 'Chase Checking', type: 'bank_account', institution: 'Chase', last4: '6789' },
  { name: 'BofA Savings', type: 'bank_account', institution: 'Bank of America', last4: '3456' },
];

// Expense templates
const EXPENSE_TEMPLATES = {
  // Housing (Fixed)
  housing: [
    { storeName: 'Wells Fargo Mortgage', category: 'Housing', subcategory: 'Mortgage', amount: 2850, paymentMethod: 'BANK_TRANSFER', paymentAccount: 'Chase Checking', isRecurring: true, recurringFrequency: 'monthly', isTaxDeductible: true, day: 1 },
    { storeName: 'HOA Management', category: 'Housing', subcategory: 'HOA', amount: 350, paymentMethod: 'BANK_TRANSFER', paymentAccount: 'Chase Checking', isRecurring: true, recurringFrequency: 'monthly', day: 1 },
    { storeName: 'PG&E', category: 'Housing', subcategory: 'Utilities', amount: [120, 180], paymentMethod: 'AUTO_PAY', paymentAccount: 'Chase Checking', isRecurring: true, recurringFrequency: 'monthly', day: 15 },
    { storeName: 'Water Company', category: 'Housing', subcategory: 'Utilities', amount: [45, 65], paymentMethod: 'AUTO_PAY', paymentAccount: 'Chase Checking', isRecurring: true, recurringFrequency: 'monthly', day: 20 },
    { storeName: 'Comcast Xfinity', category: 'Housing', subcategory: 'Internet', amount: 89.99, paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash', isRecurring: true, recurringFrequency: 'monthly', day: 5 },
    { storeName: 'State Farm', category: 'Housing', subcategory: 'Home Insurance', amount: 145, paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred', isRecurring: true, recurringFrequency: 'monthly', isTaxDeductible: false, day: 10 },
  ],
  
  // Transportation (Fixed + Variable)
  transportation: [
    { storeName: 'Toyota Financial', category: 'Transportation', subcategory: 'Car Payment', amount: 485, paymentMethod: 'AUTO_PAY', paymentAccount: 'Chase Checking', isRecurring: true, recurringFrequency: 'monthly', day: 15 },
    { storeName: 'GEICO', category: 'Transportation', subcategory: 'Car Insurance', amount: 125, paymentMethod: 'AUTO_PAY', paymentAccount: 'Chase Checking', isRecurring: true, recurringFrequency: 'monthly', day: 1 },
  ],
  
  // Transportation Variable
  transportationVariable: [
    { storeName: 'Shell', category: 'Transportation', subcategory: 'Gas', amount: [45, 75], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash' },
    { storeName: 'Chevron', category: 'Transportation', subcategory: 'Gas', amount: [40, 70], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash' },
    { storeName: 'Costco Gas', category: 'Transportation', subcategory: 'Gas', amount: [55, 85], paymentMethod: 'DEBIT_CARD', paymentAccount: 'Chase Checking' },
    { storeName: 'Uber', category: 'Transportation', subcategory: 'Rideshare', amount: [15, 45], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred' },
    { storeName: 'Lyft', category: 'Transportation', subcategory: 'Rideshare', amount: [12, 38], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred' },
    { storeName: 'City Parking', category: 'Transportation', subcategory: 'Parking', amount: [5, 25], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash' },
  ],

  // Food - Groceries
  groceries: [
    { storeName: 'Costco', category: 'Food', subcategory: 'Groceries', amount: [150, 350], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash', items: ['Organic Produce', 'Meat', 'Dairy', 'Bulk Items'] },
    { storeName: 'Whole Foods', category: 'Food', subcategory: 'Groceries', amount: [80, 180], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Amex Gold', items: ['Organic Vegetables', 'Fresh Fish', 'Specialty Items'] },
    { storeName: 'Trader Joe\'s', category: 'Food', subcategory: 'Groceries', amount: [60, 120], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Amex Gold', items: ['Snacks', 'Frozen Foods', 'Wine'] },
    { storeName: 'Safeway', category: 'Food', subcategory: 'Groceries', amount: [40, 100], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Amex Gold', items: ['Weekly Essentials'] },
  ],

  // Food - Dining
  dining: [
    { storeName: 'Chipotle', category: 'Food', subcategory: 'Dining Out', amount: [12, 18], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Amex Gold' },
    { storeName: 'Panera Bread', category: 'Food', subcategory: 'Dining Out', amount: [14, 22], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Amex Gold' },
    { storeName: 'In-N-Out Burger', category: 'Food', subcategory: 'Dining Out', amount: [10, 16], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Amex Gold' },
    { storeName: 'Olive Garden', category: 'Food', subcategory: 'Dining Out', amount: [45, 80], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred' },
    { storeName: 'Local Sushi Restaurant', category: 'Food', subcategory: 'Dining Out', amount: [60, 120], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred' },
    { storeName: 'Starbucks', category: 'Food', subcategory: 'Coffee', amount: [5, 12], paymentMethod: 'APPLE_PAY', paymentAccount: 'Chase Sapphire Preferred' },
    { storeName: 'Peet\'s Coffee', category: 'Food', subcategory: 'Coffee', amount: [4, 10], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred' },
  ],

  // Food - Delivery
  delivery: [
    { storeName: 'DoorDash', category: 'Food', subcategory: 'Food Delivery', amount: [25, 55], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred' },
    { storeName: 'Uber Eats', category: 'Food', subcategory: 'Food Delivery', amount: [22, 48], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred' },
    { storeName: 'Grubhub', category: 'Food', subcategory: 'Food Delivery', amount: [20, 45], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred' },
  ],

  // Healthcare
  healthcare: [
    { storeName: 'Kaiser Permanente', category: 'Healthcare', subcategory: 'Health Insurance', amount: 385, paymentMethod: 'PAYROLL', paymentAccount: null, isRecurring: true, recurringFrequency: 'monthly', day: 1 },
    { storeName: 'CVS Pharmacy', category: 'Healthcare', subcategory: 'Pharmacy', amount: [15, 85], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash' },
    { storeName: 'Walgreens', category: 'Healthcare', subcategory: 'Pharmacy', amount: [10, 50], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash' },
  ],

  // Entertainment & Subscriptions
  entertainment: [
    { storeName: 'Netflix', category: 'Entertainment', subcategory: 'Streaming', amount: 15.99, paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred', isRecurring: true, recurringFrequency: 'monthly', day: 8 },
    { storeName: 'Spotify', category: 'Entertainment', subcategory: 'Streaming', amount: 10.99, paymentMethod: 'CREDIT_CARD', paymentAccount: 'Amex Gold', isRecurring: true, recurringFrequency: 'monthly', day: 12 },
    { storeName: 'Disney+', category: 'Entertainment', subcategory: 'Streaming', amount: 13.99, paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred', isRecurring: true, recurringFrequency: 'monthly', day: 15 },
    { storeName: 'YouTube Premium', category: 'Entertainment', subcategory: 'Streaming', amount: 13.99, paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash', isRecurring: true, recurringFrequency: 'monthly', day: 20 },
    { storeName: 'AMC Theatres', category: 'Entertainment', subcategory: 'Movies', amount: [15, 45], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred' },
    { storeName: 'Steam', category: 'Entertainment', subcategory: 'Games', amount: [10, 60], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash' },
    { storeName: '24 Hour Fitness', category: 'Entertainment', subcategory: 'Gym', amount: 49.99, paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash', isRecurring: true, recurringFrequency: 'monthly', day: 1 },
  ],

  // Shopping
  shopping: [
    { storeName: 'Amazon', category: 'Shopping', subcategory: 'Online Shopping', amount: [20, 200], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Amazon Prime Visa' },
    { storeName: 'Target', category: 'Shopping', subcategory: 'Retail', amount: [30, 150], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash' },
    { storeName: 'Walmart', category: 'Shopping', subcategory: 'Retail', amount: [25, 120], paymentMethod: 'DEBIT_CARD', paymentAccount: 'Chase Checking' },
    { storeName: 'Apple Store', category: 'Shopping', subcategory: 'Electronics', amount: [50, 500], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred' },
    { storeName: 'Best Buy', category: 'Shopping', subcategory: 'Electronics', amount: [30, 300], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash' },
    { storeName: 'Nike', category: 'Shopping', subcategory: 'Clothing', amount: [80, 200], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Chase Sapphire Preferred' },
    { storeName: 'Nordstrom', category: 'Shopping', subcategory: 'Clothing', amount: [100, 400], paymentMethod: 'CREDIT_CARD', paymentAccount: 'Amex Gold' },
  ],

  // Phone & Communications
  phone: [
    { storeName: 'T-Mobile', category: 'Subscriptions', subcategory: 'Phone', amount: 85, paymentMethod: 'AUTO_PAY', paymentAccount: 'Chase Checking', isRecurring: true, recurringFrequency: 'monthly', day: 25 },
  ],

  // Software & Services
  software: [
    { storeName: 'Adobe Creative Cloud', category: 'Subscriptions', subcategory: 'Software', amount: 54.99, paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash', isRecurring: true, recurringFrequency: 'monthly', isBusinessExpense: true, isTaxDeductible: true, day: 15 },
    { storeName: 'Microsoft 365', category: 'Subscriptions', subcategory: 'Software', amount: 12.99, paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash', isRecurring: true, recurringFrequency: 'monthly', day: 18 },
    { storeName: 'Dropbox', category: 'Subscriptions', subcategory: 'Software', amount: 11.99, paymentMethod: 'CREDIT_CARD', paymentAccount: 'Citi Double Cash', isRecurring: true, recurringFrequency: 'monthly', day: 10 },
  ],
};

// Income templates
const INCOME_TEMPLATES = {
  // Bi-weekly Paycheck
  paycheck: {
    storeName: 'TechCorp Inc.',
    category: 'Income',
    subcategory: 'Salary',
    documentType: 'PAYCHECK',
    grossPay: 4615.38, // ~$120k annual
    deductions: {
      federal_tax: 692.31,
      state_tax: 323.08,
      social_security: 286.15,
      medicare: 66.92,
      health_insurance: 192.50,
      dental_insurance: 25.00,
      vision_insurance: 8.00,
      retirement_401k: 461.54,
    },
    netPay: 2559.88,
    paymentMethod: 'BANK_TRANSFER',
    paymentAccount: 'Chase Checking',
    isRecurring: true,
    recurringFrequency: 'biweekly',
  },
  
  // Investment income (monthly dividend)
  dividends: {
    storeName: 'Fidelity Investments',
    category: 'Income',
    subcategory: 'Investment',
    documentType: 'BANK_STATEMENT',
    amount: [150, 300],
    paymentMethod: 'BANK_TRANSFER',
    paymentAccount: 'BofA Savings',
    isTaxDeductible: false,
  },
  
  // Side gig income
  sideGig: {
    storeName: 'Upwork',
    category: 'Income',
    subcategory: 'Freelance',
    documentType: 'INVOICE',
    amount: [200, 800],
    paymentMethod: 'PAYPAL',
    paymentAccount: null,
    isTaxDeductible: false,
    isBusinessExpense: false,
  },
};

// ===== HELPER FUNCTIONS =====

function randomInRange(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getAmount(amountConfig) {
  if (Array.isArray(amountConfig)) {
    return randomInRange(amountConfig[0], amountConfig[1]);
  }
  return amountConfig;
}

function randomDate(year, month, day = null) {
  const d = day || Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, d, Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
}

function generateReceiptItems(template) {
  if (!template.items) return [];
  
  const numItems = Math.floor(Math.random() * 3) + 2;
  const items = [];
  const usedItems = new Set();
  
  for (let i = 0; i < numItems && usedItems.size < template.items.length; i++) {
    let itemName;
    do {
      itemName = template.items[Math.floor(Math.random() * template.items.length)];
    } while (usedItems.has(itemName));
    
    usedItems.add(itemName);
    const quantity = Math.floor(Math.random() * 3) + 1;
    const unitPrice = randomInRange(3, 25);
    
    items.push({
      name: itemName,
      category: template.subcategory,
      quantity: new Decimal(quantity),
      unitPrice: new Decimal(unitPrice),
      totalPrice: new Decimal(quantity * unitPrice),
      isEstimated: Math.random() > 0.7,
    });
  }
  
  return items;
}

// ===== MAIN GENERATION FUNCTIONS =====

async function generatePaychecks(year, month) {
  const receipts = [];
  const template = INCOME_TEMPLATES.paycheck;
  
  // Bi-weekly pay: 2 paychecks per month (roughly 15th and last day)
  const payDays = [15, 28];
  
  for (const day of payDays) {
    const date = new Date(year, month, day, 17, 0);
    
    receipts.push({
      isMockData: true,
      documentType: template.documentType,
      storeName: template.storeName,
      description: `Pay Period: ${month + 1}/1/${year} - ${month + 1}/${day}/${year}`,
      category: template.category,
      subcategory: template.subcategory,
      transactionDate: date,
      receivedAt: date,
      totalAmount: new Decimal(template.netPay),
      taxAmount: new Decimal(0),
      type: 'INCOME',
      paymentMethod: template.paymentMethod,
      paymentAccount: template.paymentAccount,
      isRecurring: template.isRecurring,
      recurringFrequency: template.recurringFrequency,
      source: 'EMAIL',
      status: 'completed',
      meta: {
        grossPay: template.grossPay,
        deductions: template.deductions,
        netPay: template.netPay,
        payPeriod: `${year}-${String(month + 1).padStart(2, '0')}`,
      },
      items: {
        create: [
          { name: 'Gross Pay', category: 'Earnings', totalPrice: new Decimal(template.grossPay) },
          { name: 'Federal Tax', category: 'Tax', totalPrice: new Decimal(-template.deductions.federal_tax) },
          { name: 'State Tax', category: 'Tax', totalPrice: new Decimal(-template.deductions.state_tax) },
          { name: 'Social Security', category: 'Tax', totalPrice: new Decimal(-template.deductions.social_security) },
          { name: 'Medicare', category: 'Tax', totalPrice: new Decimal(-template.deductions.medicare) },
          { name: 'Health Insurance', category: 'Benefits', totalPrice: new Decimal(-template.deductions.health_insurance) },
          { name: '401(k) Contribution', category: 'Retirement', totalPrice: new Decimal(-template.deductions.retirement_401k) },
        ]
      }
    });
  }
  
  return receipts;
}

async function generateFixedExpenses(year, month) {
  const receipts = [];
  const allFixed = [
    ...EXPENSE_TEMPLATES.housing,
    ...EXPENSE_TEMPLATES.transportation,
    ...EXPENSE_TEMPLATES.entertainment.filter(e => e.isRecurring),
    ...EXPENSE_TEMPLATES.phone,
    ...EXPENSE_TEMPLATES.software,
  ];
  
  for (const template of allFixed) {
    const day = template.day || Math.floor(Math.random() * 28) + 1;
    const date = new Date(year, month, day, 10, Math.floor(Math.random() * 60));
    const amount = getAmount(template.amount);
    
    receipts.push({
      isMockData: true,
      documentType: 'BILL',
      storeName: template.storeName,
      category: template.category,
      subcategory: template.subcategory,
      transactionDate: date,
      receivedAt: new Date(date.getTime() + 86400000), // Received next day
      totalAmount: new Decimal(amount),
      taxAmount: new Decimal(0),
      type: 'EXPENSE',
      paymentMethod: template.paymentMethod,
      paymentAccount: template.paymentAccount,
      isRecurring: template.isRecurring || false,
      recurringFrequency: template.recurringFrequency || null,
      isTaxDeductible: template.isTaxDeductible || false,
      isBusinessExpense: template.isBusinessExpense || false,
      source: template.paymentMethod === 'CREDIT_CARD' ? 'BANK_SYNC' : 'EMAIL',
      status: 'completed',
    });
  }
  
  return receipts;
}

async function generateVariableExpenses(year, month) {
  const receipts = [];
  
  // Gas: 3-5 fillups per month
  const gasStops = Math.floor(Math.random() * 3) + 3;
  for (let i = 0; i < gasStops; i++) {
    const template = EXPENSE_TEMPLATES.transportationVariable[Math.floor(Math.random() * 3)];
    const date = randomDate(year, month);
    const amount = getAmount(template.amount);
    
    receipts.push({
      isMockData: true,
      documentType: 'RECEIPT',
      storeName: template.storeName,
      category: template.category,
      subcategory: template.subcategory,
      transactionDate: date,
      receivedAt: date,
      totalAmount: new Decimal(amount),
      taxAmount: new Decimal(amount * 0.0825),
      type: 'EXPENSE',
      paymentMethod: template.paymentMethod,
      paymentAccount: template.paymentAccount,
      source: 'BANK_SYNC',
      status: 'completed',
      distanceKm: new Decimal(randomInRange(200, 400)),
    });
  }
  
  // Groceries: 4-6 trips per month
  const groceryTrips = Math.floor(Math.random() * 3) + 4;
  for (let i = 0; i < groceryTrips; i++) {
    const template = EXPENSE_TEMPLATES.groceries[Math.floor(Math.random() * EXPENSE_TEMPLATES.groceries.length)];
    const date = randomDate(year, month);
    const amount = getAmount(template.amount);
    
    receipts.push({
      isMockData: true,
      documentType: 'RECEIPT',
      storeName: template.storeName,
      category: template.category,
      subcategory: template.subcategory,
      transactionDate: date,
      receivedAt: date,
      totalAmount: new Decimal(amount),
      taxAmount: new Decimal(amount * 0.05),
      type: 'EXPENSE',
      paymentMethod: template.paymentMethod,
      paymentAccount: template.paymentAccount,
      source: 'EMAIL',
      status: 'completed',
      items: { create: generateReceiptItems(template) },
    });
  }
  
  // Dining out: 8-15 times per month
  const diningTrips = Math.floor(Math.random() * 8) + 8;
  for (let i = 0; i < diningTrips; i++) {
    const template = EXPENSE_TEMPLATES.dining[Math.floor(Math.random() * EXPENSE_TEMPLATES.dining.length)];
    const date = randomDate(year, month);
    const amount = getAmount(template.amount);
    
    receipts.push({
      isMockData: true,
      documentType: 'RECEIPT',
      storeName: template.storeName,
      category: template.category,
      subcategory: template.subcategory,
      transactionDate: date,
      receivedAt: date,
      totalAmount: new Decimal(amount),
      taxAmount: new Decimal(amount * 0.0925),
      type: 'EXPENSE',
      paymentMethod: template.paymentMethod,
      paymentAccount: template.paymentAccount,
      source: 'BANK_SYNC',
      status: 'completed',
    });
  }
  
  // Food delivery: 3-6 times per month
  const deliveryOrders = Math.floor(Math.random() * 4) + 3;
  for (let i = 0; i < deliveryOrders; i++) {
    const template = EXPENSE_TEMPLATES.delivery[Math.floor(Math.random() * EXPENSE_TEMPLATES.delivery.length)];
    const date = randomDate(year, month);
    const amount = getAmount(template.amount);
    
    receipts.push({
      isMockData: true,
      documentType: 'RECEIPT',
      storeName: template.storeName,
      category: template.category,
      subcategory: template.subcategory,
      transactionDate: date,
      receivedAt: date,
      totalAmount: new Decimal(amount),
      taxAmount: new Decimal(amount * 0.0925),
      type: 'EXPENSE',
      paymentMethod: template.paymentMethod,
      paymentAccount: template.paymentAccount,
      source: 'EMAIL',
      status: 'completed',
    });
  }
  
  // Shopping: 3-8 purchases per month
  const shoppingTrips = Math.floor(Math.random() * 6) + 3;
  for (let i = 0; i < shoppingTrips; i++) {
    const template = EXPENSE_TEMPLATES.shopping[Math.floor(Math.random() * EXPENSE_TEMPLATES.shopping.length)];
    const date = randomDate(year, month);
    const amount = getAmount(template.amount);
    
    receipts.push({
      isMockData: true,
      documentType: 'RECEIPT',
      storeName: template.storeName,
      category: template.category,
      subcategory: template.subcategory,
      transactionDate: date,
      receivedAt: date,
      totalAmount: new Decimal(amount),
      taxAmount: new Decimal(amount * 0.0875),
      type: 'EXPENSE',
      paymentMethod: template.paymentMethod,
      paymentAccount: template.paymentAccount,
      source: template.storeName === 'Amazon' ? 'EMAIL' : 'BANK_SYNC',
      status: 'completed',
    });
  }
  
  // Healthcare: 0-2 visits per month
  const healthcareVisits = Math.floor(Math.random() * 3);
  for (let i = 0; i < healthcareVisits; i++) {
    const template = EXPENSE_TEMPLATES.healthcare[Math.floor(Math.random() * 2) + 1]; // Skip insurance
    const date = randomDate(year, month);
    const amount = getAmount(template.amount);
    
    receipts.push({
      isMockData: true,
      documentType: 'RECEIPT',
      storeName: template.storeName,
      category: template.category,
      subcategory: template.subcategory,
      transactionDate: date,
      receivedAt: date,
      totalAmount: new Decimal(amount),
      taxAmount: new Decimal(0),
      type: 'EXPENSE',
      paymentMethod: template.paymentMethod,
      paymentAccount: template.paymentAccount,
      source: 'BANK_SYNC',
      status: 'completed',
    });
  }
  
  // Uber/Lyft: 2-6 rides per month
  const rides = Math.floor(Math.random() * 5) + 2;
  for (let i = 0; i < rides; i++) {
    const template = EXPENSE_TEMPLATES.transportationVariable[Math.random() > 0.5 ? 3 : 4]; // Uber or Lyft
    const date = randomDate(year, month);
    const amount = getAmount(template.amount);
    
    receipts.push({
      isMockData: true,
      documentType: 'RECEIPT',
      storeName: template.storeName,
      category: template.category,
      subcategory: template.subcategory,
      transactionDate: date,
      receivedAt: date,
      totalAmount: new Decimal(amount),
      taxAmount: new Decimal(0),
      type: 'EXPENSE',
      paymentMethod: template.paymentMethod,
      paymentAccount: template.paymentAccount,
      source: 'EMAIL',
      status: 'completed',
    });
  }
  
  // Entertainment (variable): 1-3 per month
  const entertainmentEvents = Math.floor(Math.random() * 3) + 1;
  const variableEntertainment = EXPENSE_TEMPLATES.entertainment.filter(e => !e.isRecurring);
  for (let i = 0; i < entertainmentEvents; i++) {
    const template = variableEntertainment[Math.floor(Math.random() * variableEntertainment.length)];
    const date = randomDate(year, month);
    const amount = getAmount(template.amount);
    
    receipts.push({
      isMockData: true,
      documentType: 'RECEIPT',
      storeName: template.storeName,
      category: template.category,
      subcategory: template.subcategory,
      transactionDate: date,
      receivedAt: date,
      totalAmount: new Decimal(amount),
      taxAmount: new Decimal(amount * 0.0925),
      type: 'EXPENSE',
      paymentMethod: template.paymentMethod,
      paymentAccount: template.paymentAccount,
      source: 'BANK_SYNC',
      status: 'completed',
    });
  }
  
  return receipts;
}

async function generateOtherIncome(year, month) {
  const receipts = [];
  
  // Dividend income (monthly)
  const dividendTemplate = INCOME_TEMPLATES.dividends;
  const dividendDate = new Date(year, month, 20, 9, 0);
  const dividendAmount = getAmount(dividendTemplate.amount);
  
  receipts.push({
    isMockData: true,
    documentType: dividendTemplate.documentType,
    storeName: dividendTemplate.storeName,
    description: `Monthly Dividend Payment - ${month + 1}/${year}`,
    category: dividendTemplate.category,
    subcategory: dividendTemplate.subcategory,
    transactionDate: dividendDate,
    receivedAt: dividendDate,
    totalAmount: new Decimal(dividendAmount),
    taxAmount: new Decimal(0),
    type: 'INCOME',
    paymentMethod: dividendTemplate.paymentMethod,
    paymentAccount: dividendTemplate.paymentAccount,
    source: 'EMAIL',
    status: 'completed',
  });
  
  // Side gig income (random, ~50% chance per month)
  if (Math.random() > 0.5) {
    const sideGigTemplate = INCOME_TEMPLATES.sideGig;
    const sideGigDate = randomDate(year, month);
    const sideGigAmount = getAmount(sideGigTemplate.amount);
    
    receipts.push({
      isMockData: true,
      documentType: sideGigTemplate.documentType,
      storeName: sideGigTemplate.storeName,
      description: 'Freelance consulting project',
      category: sideGigTemplate.category,
      subcategory: sideGigTemplate.subcategory,
      transactionDate: sideGigDate,
      receivedAt: sideGigDate,
      totalAmount: new Decimal(sideGigAmount),
      taxAmount: new Decimal(0),
      type: 'INCOME',
      paymentMethod: sideGigTemplate.paymentMethod,
      paymentAccount: sideGigTemplate.paymentAccount,
      isTaxDeductible: false,
      source: 'EMAIL',
      status: 'completed',
    });
  }
  
  return receipts;
}

// ===== MAIN EXECUTION =====

async function seedPaymentAccounts() {
  console.log('💳 Seeding payment accounts...');
  
  for (const account of PAYMENT_ACCOUNTS) {
    await prisma.paymentAccount.upsert({
      where: { id: account.name.replace(/\s+/g, '-').toLowerCase() },
      update: account,
      create: {
        id: account.name.replace(/\s+/g, '-').toLowerCase(),
        ...account,
      },
    });
  }
  
  console.log(`   ✅ Created ${PAYMENT_ACCOUNTS.length} payment accounts`);
}

async function seedAllData() {
  console.log('🌱 Starting comprehensive mock data generation...\n');
  
  // Seed payment accounts first
  await seedPaymentAccounts();
  
  let totalReceipts = 0;
  
  for (let i = 0; i < MONTHS_TO_GENERATE; i++) {
    const date = new Date(START_MONTH);
    date.setMonth(START_MONTH.getMonth() + i);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    console.log(`📅 Generating data for ${monthKey}...`);
    
    // Generate all types of transactions
    const paychecks = await generatePaychecks(year, month);
    const fixedExpenses = await generateFixedExpenses(year, month);
    const variableExpenses = await generateVariableExpenses(year, month);
    const otherIncome = await generateOtherIncome(year, month);
    
    const allReceipts = [...paychecks, ...fixedExpenses, ...variableExpenses, ...otherIncome];
    
    // Insert into database
    for (const receipt of allReceipts) {
      await prisma.receipt.create({ data: receipt });
    }
    
    totalReceipts += allReceipts.length;
    
    // Calculate month totals for summary
    const income = allReceipts
      .filter(r => r.type === 'INCOME')
      .reduce((sum, r) => sum + parseFloat(r.totalAmount.toString()), 0);
    const expenses = allReceipts
      .filter(r => r.type === 'EXPENSE')
      .reduce((sum, r) => sum + parseFloat(r.totalAmount.toString()), 0);
    
    console.log(`   ✅ ${monthKey}: ${allReceipts.length} transactions`);
    console.log(`      💵 Income: $${income.toFixed(2)} | 💸 Expenses: $${expenses.toFixed(2)}`);
    console.log(`      📊 Net: $${(income - expenses).toFixed(2)}\n`);
  }
  
  console.log(`\n✨ Mock data generation complete!`);
  console.log(`   Total receipts created: ${totalReceipts}`);
}

async function deleteMockData() {
  console.log('🗑️ Deleting all mock data...');
  
  const result = await prisma.receipt.deleteMany({
    where: { isMockData: true }
  });
  
  console.log(`   ✅ Deleted ${result.count} mock receipts`);
  
  // Also clean up related data
  await prisma.metricMonthly.deleteMany({});
  await prisma.analysisReport.deleteMany({});
  
  console.log('   ✅ Cleaned up metrics and analysis reports');
}

// CLI handling
const args = process.argv.slice(2);
const command = args[0] || 'seed';

async function main() {
  try {
    if (command === 'seed') {
      await seedAllData();
    } else if (command === 'delete') {
      await deleteMockData();
    } else if (command === 'reset') {
      await deleteMockData();
      await seedAllData();
    } else {
      console.log('Usage: node seed-comprehensive-mock.js [seed|delete|reset]');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


