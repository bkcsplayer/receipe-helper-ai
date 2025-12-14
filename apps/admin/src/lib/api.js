import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

// Metrics APIs
export const fetchMetrics = (month) =>
  apiClient.get('/api/v2/metrics', { params: { month } }).then((res) => res.data);

export const recomputeMetrics = (month) =>
  apiClient.post('/api/v2/metrics/recompute', { month }).then((res) => res.data);

// Analysis APIs
export const fetchAnalysis = (month) =>
  apiClient.get('/api/v2/analysis', { params: { month } }).then((res) => res.data);

export const generateAnalysis = (month) =>
  apiClient.post('/api/v2/analysis/generate', { month }).then((res) => res.data);

// Email API
export const sendReportEmail = (month) =>
  apiClient.post('/api/v2/email/send', { month }).then((res) => res.data);

// Enhanced Analytics APIs - fetch raw data for custom date ranges
export const fetchReceipts = (params = {}) =>
  apiClient.get('/api/v2/receipts', { params }).then((res) => res.data);

export const fetchReceiptStats = async (startDate, endDate) => {
  const params = {
    pageSize: 1000,
    startDate,
    endDate
  };
  const response = await apiClient.get('/api/v2/receipts', { params });
  const receipts = response.data.data || [];
  
  // Calculate statistics from raw data
  const stats = {
    totalReceipts: receipts.length,
    totalSpend: 0,
    totalIncome: 0,
    netCashFlow: 0,
    avgTransaction: 0,
    byCategory: {},
    byStore: {},
    bySource: {},
    byDate: {},
    byDayOfWeek: {},
    items: [],
    trends: [],
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  receipts.forEach(r => {
    const amount = parseFloat(r.totalAmount) || 0;
    const isIncome = r.type === 'INCOME';
    
    if (isIncome) {
      stats.totalIncome += amount;
    } else {
      stats.totalSpend += amount;
    }

    // By Category
    const cat = r.category || 'Uncategorized';
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + amount;

    // By Store
    const store = r.storeName || 'Unknown';
    stats.byStore[store] = (stats.byStore[store] || 0) + amount;

    // By Source
    const source = r.source || 'Unknown';
    stats.bySource[source] = (stats.bySource[source] || 0) + amount;

    // By Date (for trends)
    const dateKey = r.transactionDate?.split('T')[0];
    if (dateKey) {
      stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + (isIncome ? -amount : amount);
    }

    // By Day of Week
    const date = new Date(r.transactionDate);
    const dayName = dayNames[date.getDay()];
    stats.byDayOfWeek[dayName] = (stats.byDayOfWeek[dayName] || 0) + amount;

    // Collect items
    if (r.items) {
      r.items.forEach(item => {
        stats.items.push({
          ...item,
          storeName: r.storeName,
          category: item.category || r.category,
          date: r.transactionDate
        });
      });
    }
  });

  stats.netCashFlow = stats.totalIncome - stats.totalSpend;
  stats.avgTransaction = stats.totalReceipts > 0 ? stats.totalSpend / stats.totalReceipts : 0;

  // Convert byDate to sorted array for trending
  stats.trends = Object.entries(stats.byDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Convert objects to sorted arrays
  stats.categoryBreakdown = Object.entries(stats.byCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  stats.storeBreakdown = Object.entries(stats.byStore)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  stats.sourceBreakdown = Object.entries(stats.bySource)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  stats.dayOfWeekBreakdown = dayNames.map(day => ({
    name: day.substring(0, 3),
    amount: stats.byDayOfWeek[day] || 0
  }));

  // Group items by category for detailed analysis
  stats.itemsByCategory = {};
  stats.items.forEach(item => {
    const cat = item.category || 'Uncategorized';
    if (!stats.itemsByCategory[cat]) {
      stats.itemsByCategory[cat] = [];
    }
    stats.itemsByCategory[cat].push(item);
  });

  return stats;
};

// Custom date range analysis
export const generateCustomAnalysis = async (startDate, endDate) => {
  const response = await apiClient.post('/api/v2/analysis/generate-custom', { startDate, endDate });
  return response.data;
};

// Mock Data Management APIs
export const fetchMockDataStatus = () =>
  apiClient.get('/api/v2/mock-data/status').then((res) => res.data);

export const seedMockData = () =>
  apiClient.post('/api/v2/mock-data/seed').then((res) => res.data);

export const deleteMockData = () =>
  apiClient.delete('/api/v2/mock-data').then((res) => res.data);
