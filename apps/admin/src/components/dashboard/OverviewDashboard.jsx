import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Typography, Grid, Button, Stack, TextField, Chip, Box,
  IconButton, Paper, Divider, Avatar, Tab, Tabs, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, Alert, Card, CardContent,
  CircularProgress,
} from '@mui/material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area, Legend,
} from 'recharts';
import {
  fetchMetrics, fetchAnalysis, recomputeMetrics, generateAnalysis,
  sendReportEmail, fetchReceiptStats, fetchMockDataStatus, seedMockData, deleteMockData
} from '../../lib/api';
import {
  TrendingUp, TrendingDown, Refresh, AutoAwesome, Email,
  Store, PieChart as PieIcon, Receipt, CreditCard, ShowChart,
  AccountBalance, Savings, Settings, Payment, CalendarToday,
  Add, Delete, Science,
} from '@mui/icons-material';
import { SystemStatusPanel } from './SystemStatusPanel';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

// Compact Stat Card
const StatCard = ({ label, value, icon: Icon, color, subtitle, trend }) => (
  <Card 
    elevation={0} 
    sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}30`,
      borderRadius: 3,
    }}
  >
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color, mt: 0.5, fontSize: '1.5rem' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, color, width: 40, height: 40 }}>
          <Icon sx={{ fontSize: 20 }} />
        </Avatar>
      </Stack>
      {trend !== undefined && (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
          {trend >= 0 ? <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} /> : <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />}
          <Typography variant="caption" color={trend >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
            {Math.abs(trend).toFixed(1)}%
          </Typography>
        </Stack>
      )}
    </CardContent>
  </Card>
);

// Date Presets
const DatePresets = ({ onSelect, active }) => {
  const presets = [
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: '3 Months', value: 'last3Months' },
    { label: '6 Months', value: 'last6Months' },
    { label: 'Year', value: 'thisYear' },
  ];
  return (
    <Stack direction="row" spacing={0.5}>
      {presets.map(p => (
        <Chip
          key={p.value}
          label={p.label}
          onClick={() => onSelect(p.value)}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.7rem',
            bgcolor: active === p.value ? 'primary.main' : 'transparent',
            color: active === p.value ? 'white' : 'text.secondary',
            border: active === p.value ? 'none' : '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: active === p.value ? 'primary.dark' : 'action.hover' },
          }}
        />
      ))}
    </Stack>
  );
};

const getDateRangeFromPreset = (preset) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  switch (preset) {
    case 'thisMonth':
      return { start: new Date(year, month, 1).toISOString().split('T')[0], end: new Date(year, month + 1, 0).toISOString().split('T')[0] };
    case 'lastMonth':
      return { start: new Date(year, month - 1, 1).toISOString().split('T')[0], end: new Date(year, month, 0).toISOString().split('T')[0] };
    case 'last3Months':
      return { start: new Date(year, month - 2, 1).toISOString().split('T')[0], end: new Date(year, month + 1, 0).toISOString().split('T')[0] };
    case 'last6Months':
      return { start: new Date(year, month - 5, 1).toISOString().split('T')[0], end: new Date(year, month + 1, 0).toISOString().split('T')[0] };
    case 'thisYear':
      return { start: new Date(year, 0, 1).toISOString().split('T')[0], end: new Date(year, 11, 31).toISOString().split('T')[0] };
    default:
      return { start: new Date(year, month, 1).toISOString().split('T')[0], end: new Date(year, month + 1, 0).toISOString().split('T')[0] };
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1.5, boxShadow: 2, borderRadius: 2 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary">{label}</Typography>
        {payload.map((entry, index) => (
          <Typography key={index} variant="body2" sx={{ color: entry.color, fontWeight: 600 }}>
            {formatCurrency(entry.value)}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

export const OverviewDashboard = () => {
  const [datePreset, setDatePreset] = useState('thisMonth');
  const [dateRange, setDateRange] = useState(() => getDateRangeFromPreset('thisMonth'));
  const [stats, setStats] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionState, setActionState] = useState({ recompute: false, analysis: false, email: false });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Mock Data Management
  const [mockStatus, setMockStatus] = useState(null);
  const [mockLoading, setMockLoading] = useState(false);

  const loadMockStatus = useCallback(async () => {
    try {
      const status = await fetchMockDataStatus();
      setMockStatus(status);
    } catch (err) {
      console.error('Failed to load mock status:', err);
    }
  }, []);

  const handleMockAction = async (action) => {
    setMockLoading(true);
    try {
      if (action === 'seed') {
        await seedMockData();
      } else {
        await deleteMockData();
      }
      await Promise.all([loadMockStatus(), loadData()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setMockLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, analysisData] = await Promise.all([
        fetchReceiptStats(dateRange.start, dateRange.end),
        fetchAnalysis(dateRange.start.substring(0, 7))
      ]);
      setStats(statsData);
      setAnalysis(analysisData);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { loadData(); loadMockStatus(); }, [loadData, loadMockStatus]);

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    setDateRange(getDateRangeFromPreset(preset));
  };

  const handleAction = async (type, fn) => {
    setActionState(prev => ({ ...prev, [type]: true }));
    try {
      await fn();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionState(prev => ({ ...prev, [type]: false }));
    }
  };

  const monthKey = dateRange.start.substring(0, 7);
  const savingsRate = stats?.totalIncome > 0 ? ((stats.totalIncome - stats.totalSpend) / stats.totalIncome * 100).toFixed(1) : 0;

  // Filter out Income from expense categories for pie chart
  const expenseCategories = useMemo(() => {
    return (stats?.categoryBreakdown || []).filter(c => c.name !== 'Income');
  }, [stats]);

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Financial Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your income, expenses, and savings
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <DatePresets onSelect={handlePresetChange} active={datePreset} />
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
            <TextField
              type="date"
              value={dateRange.start}
              onChange={(e) => { setDatePreset('custom'); setDateRange(prev => ({ ...prev, start: e.target.value })); }}
              size="small"
              sx={{ width: 130, '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.8 } }}
            />
            <Typography color="text.secondary">—</Typography>
            <TextField
              type="date"
              value={dateRange.end}
              onChange={(e) => { setDatePreset('custom'); setDateRange(prev => ({ ...prev, end: e.target.value })); }}
              size="small"
              sx={{ width: 130, '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.8 } }}
            />
          </Stack>
          <IconButton onClick={loadData} disabled={loading} size="small" sx={{ bgcolor: 'white', boxShadow: 1 }}>
            <Refresh fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      {/* Mock Data Management Bar */}
      {mockStatus && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1.5, 
            mb: 2, 
            borderRadius: 2, 
            border: '1px solid',
            borderColor: mockStatus.hasMockData ? 'warning.main' : 'divider',
            bgcolor: mockStatus.hasMockData ? alpha('#f59e0b', 0.05) : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Science sx={{ color: mockStatus.hasMockData ? 'warning.main' : 'text.secondary', fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary">
              <strong>Test Data:</strong> {mockStatus.mockDataCount} mock / {mockStatus.realDataCount} real receipts
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {mockLoading && <CircularProgress size={16} />}
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<Add fontSize="small" />}
              onClick={() => handleMockAction('seed')}
              disabled={mockLoading}
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Add Mock
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Delete fontSize="small" />}
              onClick={() => handleMockAction('delete')}
              disabled={mockLoading || !mockStatus.hasMockData}
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Delete Mock
            </Button>
          </Stack>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard label="Total Income" value={formatCurrency(stats?.totalIncome)} icon={TrendingUp} color="#22c55e" />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard label="Total Expenses" value={formatCurrency(stats?.totalSpend)} icon={TrendingDown} color="#ef4444" subtitle={`${stats?.totalReceipts || 0} txns`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard label="Net Cash Flow" value={formatCurrency(stats?.netCashFlow)} icon={AccountBalance} color={stats?.netCashFlow >= 0 ? '#22c55e' : '#ef4444'} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard label="Savings Rate" value={`${savingsRate}%`} icon={Savings} color="#6366f1" />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard label="Avg Transaction" value={formatCurrency(stats?.avgTransaction)} icon={Receipt} color="#f59e0b" />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'white', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{ 
            px: 2, 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }
          }}
        >
          <Tab icon={<ShowChart sx={{ fontSize: 18 }} />} label="Overview" iconPosition="start" />
          <Tab icon={<PieIcon sx={{ fontSize: 18 }} />} label="Categories" iconPosition="start" />
          <Tab icon={<Store sx={{ fontSize: 18 }} />} label="Merchants" iconPosition="start" />
          <Tab icon={<Payment sx={{ fontSize: 18 }} />} label="Payments" iconPosition="start" />
          <Tab icon={<CreditCard sx={{ fontSize: 18 }} />} label="Transactions" iconPosition="start" />
          <Tab icon={<AutoAwesome sx={{ fontSize: 18 }} />} label="AI Insights" iconPosition="start" />
          <Tab icon={<Settings sx={{ fontSize: 18 }} />} label="System" iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Stack spacing={3}>
              {/* 趋势图 - 全宽 */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Daily Spending Trend</Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.trends || []} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} width={70} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="amount" stroke="#6366f1" fill="url(#colorSpend)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              {/* 按星期统计 - 水平柱状图，全宽 */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Spending by Day of Week</Typography>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.dayOfWeekBreakdown || []} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} width={70} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Stack>
          )}

          {/* Categories Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={5}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Expense Distribution</Typography>
                  <Box sx={{ height: 450 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseCategories}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={2}
                        >
                          {expenseCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend 
                          layout="horizontal" 
                          align="center" 
                          verticalAlign="bottom"
                          formatter={(value) => <span style={{ color: '#374151', fontSize: 13, fontWeight: 500 }}>{value}</span>}
                          wrapperStyle={{ paddingTop: 20 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} lg={7}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Category Breakdown</Typography>
                  <TableContainer sx={{ maxHeight: 450 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50', fontSize: '0.9rem' }}>Category</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.50', fontSize: '0.9rem' }}>Amount</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.50', width: 200, fontSize: '0.9rem' }}>Share</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expenseCategories.map((cat, idx) => {
                          const total = expenseCategories.reduce((sum, c) => sum + c.amount, 0);
                          const percent = total > 0 ? (cat.amount / total * 100) : 0;
                          return (
                            <TableRow key={cat.name} hover sx={{ '& td': { py: 1.5 } }}>
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: COLORS[idx % COLORS.length] }} />
                                  <Typography variant="body1" fontWeight={500}>{cat.name}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" fontWeight={600}>{formatCurrency(cat.amount)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={percent}
                                    sx={{ 
                                      flex: 1, 
                                      height: 10, 
                                      borderRadius: 5, 
                                      bgcolor: alpha(COLORS[idx % COLORS.length], 0.15),
                                      '& .MuiLinearProgress-bar': { bgcolor: COLORS[idx % COLORS.length], borderRadius: 5 }
                                    }}
                                  />
                                  <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ minWidth: 45 }}>
                                    {percent.toFixed(1)}%
                                  </Typography>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Merchants Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={7}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Top Merchants</Typography>
                  <TableContainer sx={{ maxHeight: 500 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Merchant</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Amount</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.50', width: 200 }}>Share</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(stats?.storeBreakdown || []).slice(0, 10).map((store, idx) => {
                          const total = (stats?.storeBreakdown || []).reduce((sum, s) => sum + s.amount, 0);
                          const percent = total > 0 ? (store.amount / total * 100) : 0;
                          return (
                            <TableRow key={store.name} hover>
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS[idx % COLORS.length], fontSize: '0.8rem' }}>
                                    {store.name?.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight={500}>{store.name}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={600}>{formatCurrency(store.amount)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={percent}
                                    sx={{ 
                                      flex: 1, 
                                      height: 8, 
                                      borderRadius: 4, 
                                      bgcolor: alpha(COLORS[idx % COLORS.length], 0.15),
                                      '& .MuiLinearProgress-bar': { bgcolor: COLORS[idx % COLORS.length], borderRadius: 4 }
                                    }}
                                  />
                                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ minWidth: 40 }}>
                                    {percent.toFixed(1)}%
                                  </Typography>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} lg={5}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>By Source</Typography>
                  <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(stats?.sourceBreakdown || []).length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats?.sourceBreakdown || []}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="40%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                          >
                            {(stats?.sourceBreakdown || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Legend 
                            layout="horizontal"
                            verticalAlign="bottom"
                            formatter={(value) => <span style={{ color: '#374151', fontSize: 12, fontWeight: 500 }}>{value}</span>}
                            wrapperStyle={{ paddingTop: 10 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Typography color="text.secondary">No source data available</Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Payments Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Payment Methods</Typography>
                  <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(stats?.sourceBreakdown || []).length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats?.sourceBreakdown || []}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="40%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                          >
                            {(stats?.sourceBreakdown || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Legend 
                            layout="horizontal"
                            verticalAlign="bottom"
                            formatter={(value) => <span style={{ color: '#374151', fontSize: 12, fontWeight: 500 }}>{value}</span>}
                            wrapperStyle={{ paddingTop: 10 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Typography color="text.secondary">No payment data available</Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Usage Summary</Typography>
                  <TableContainer sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Source</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Amount</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(stats?.sourceBreakdown || []).map((source, idx) => (
                          <TableRow key={source.name} hover sx={{ '& td': { py: 2 } }}>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: COLORS[idx % COLORS.length] }}>
                                  <CreditCard sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Typography variant="body1" fontWeight={500}>{source.name}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" fontWeight={600}>{formatCurrency(source.amount)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip label={source.count || '-'} size="medium" sx={{ fontWeight: 600 }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Transactions Tab */}
          {activeTab === 4 && (
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Transactions
                  <Chip label={`${stats?.totalReceipts || 0} total`} size="small" sx={{ ml: 1.5, fontWeight: 600 }} />
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 550 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50', fontSize: '0.9rem' }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50', fontSize: '0.9rem' }}>Store</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50', fontSize: '0.9rem' }}>Category</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.50', fontSize: '0.9rem' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50', fontSize: '0.9rem' }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(stats?.items || []).slice(0, 100).map((item, idx) => (
                      <TableRow key={idx} hover sx={{ '& td': { py: 1.5 } }}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body1" fontWeight={500} sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.name}
                            </Typography>
                            {item.isEstimated && <Chip label="AI" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#8b5cf620', color: '#8b5cf6', fontWeight: 600 }} />}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{item.storeName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={item.category || 'N/A'} size="small" sx={{ fontWeight: 500 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight={600}>{formatCurrency(item.totalPrice)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(item.date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* AI Insights Tab */}
          {activeTab === 5 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>AI Financial Analysis</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Period: {dateRange.start} to {dateRange.end}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AutoAwesome />}
                    onClick={() => handleAction('analysis', () => generateAnalysis(monthKey))}
                    disabled={actionState.analysis}
                  >
                    {actionState.analysis ? 'Analyzing...' : 'Generate'}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Email />}
                    onClick={() => handleAction('email', () => sendReportEmail(monthKey))}
                    disabled={actionState.email}
                  >
                    {actionState.email ? 'Sending...' : 'Email Report'}
                  </Button>
                </Stack>
              </Stack>

              <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Executive Summary</Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {analysis?.summaryText || 'No analysis available. Click "Generate" to create one.'}
                </Typography>
              </Paper>

              {analysis?.recommendations?.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Recommendations</Typography>
                  <Grid container spacing={2}>
                    {analysis.recommendations.map((rec, idx) => (
                      <Grid item xs={12} md={4} key={idx}>
                        <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>{rec.title}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                              {rec.detail || rec.description}
                            </Typography>
                            <Chip label={rec.recommended_action || rec.action || 'Review'} size="small" color="primary" />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}

              <Divider sx={{ my: 3 }} />
              <Grid container spacing={2}>
                {[
                  { label: 'Transactions', value: stats?.totalReceipts || 0 },
                  { label: 'Categories', value: stats?.categoryBreakdown?.length || 0 },
                  { label: 'Merchants', value: stats?.storeBreakdown?.length || 0 },
                  { label: 'Savings Rate', value: `${savingsRate}%` },
                ].map((item, idx) => (
                  <Grid item xs={6} md={3} key={idx}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight={700} color="primary.main">{item.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* System Tab */}
          {activeTab === 6 && <SystemStatusPanel />}
        </Box>
      </Paper>
    </Box>
  );
};
