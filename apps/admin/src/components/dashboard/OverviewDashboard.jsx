import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, Typography, Grid, Button, Stack, TextField, Chip } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { fetchMetrics, fetchAnalysis, recomputeMetrics, generateAnalysis, sendReportEmail } from '../../lib/api';

const COLORS = ['#FF8C42', '#5F7A3C', '#2A3A68', '#F4C95D', '#F25F5C'];

const MetricCard = ({ label, value, unit }) => (
  <Card sx={{ borderRadius: 3, background: '#fff8f0', border: '1px solid #2A3A68' }}>
    <CardContent>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontFamily: '"Patrick Hand", cursive', color: '#2A3A68' }}>
        {value !== null && value !== undefined ? `${value.toLocaleString()} ${unit || ''}` : 'N/A'}
      </Typography>
    </CardContent>
  </Card>
);

const useMonthState = () => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(defaultMonth);
  return [month, setMonth];
};

export const OverviewDashboard = () => {
  const [month, setMonth] = useMonthState();
  const [metrics, setMetrics] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionState, setActionState] = useState({ recompute: false, analysis: false, email: false });
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [metricData, analysisData] = await Promise.all([fetchMetrics(month), fetchAnalysis(month)]);
      setMetrics(metricData);
      setAnalysis(analysisData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metricMap = useMemo(() => {
    const map = {};
    metrics.forEach((metric) => {
      map[metric.metricKey] = metric;
    });
    return map;
  }, [metrics]);

  const topMerchants = metricMap.top_merchants?.valueJson || [];

  const pieData = useMemo(() => {
    const breakdown = analysis?.spendingBreakdown || [];
    if (breakdown.length > 0) {
      return breakdown.map((entry, idx) => ({
        name: entry.category || entry.name || `Bucket ${idx + 1}`,
        value: Number(entry.value ?? entry.amount ?? 1)
      }));
    }
    return topMerchants.map((merchant) => ({
      name: merchant.name,
      value: merchant.amount
    }));
  }, [analysis, topMerchants]);

  const handleAction = async (type, fn) => {
    setActionState((prev) => ({ ...prev, [type]: true }));
    setError('');
    try {
      await fn();
      await loadData();
    } catch (err) {
      setError(err.message || `Failed to run ${type}`);
    } finally {
      setActionState((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
        <TextField
          label="Month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            disabled={actionState.recompute}
            onClick={() => handleAction('recompute', () => recomputeMetrics(month))}
          >
            {actionState.recompute ? 'Recomputing...' : 'Recompute Metrics'}
          </Button>
          <Button
            variant="outlined"
            disabled={actionState.analysis}
            onClick={() => handleAction('analysis', () => generateAnalysis(month))}
          >
            {actionState.analysis ? 'Consulting AI...' : 'Regenerate Insights'}
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#FF8C42' }}
            disabled={actionState.email}
            onClick={() => handleAction('email', () => sendReportEmail(month))}
          >
            {actionState.email ? 'Sending...' : 'Email Report'}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Card sx={{ border: '1px solid #F25F5C', background: '#ffecec' }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Monthly Spend"
            value={metricMap.total_spend_month?.valueNumeric}
            unit={metricMap.total_spend_month?.unit}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Fuel / 100km"
            value={metricMap.fuel_cost_per_100km?.valueNumeric}
            unit="currency/100km"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Maintenance / 100km"
            value={metricMap.maintenance_cost_per_100km?.valueNumeric}
            unit="currency/100km"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #2A3A68' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Merchants
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topMerchants}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#FF8C42" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #2A3A68' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Spending Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, border: '2px dashed #2A3A68', background: '#fdf5ea' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI Executive Summary
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {analysis?.summaryText || 'No insights generated yet.'}
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Optimization Opportunities
          </Typography>
          <Stack spacing={1}>
            {(analysis?.recommendations || []).map((rec, idx) => (
              <Card key={idx} variant="outlined" sx={{ borderRadius: 2, borderColor: '#FF8C42' }}>
                <CardContent>
                  <Typography variant="subtitle2">{rec.title}</Typography>
                  <Typography variant="body2">{rec.detail}</Typography>
                  <Chip label={rec.recommended_action} sx={{ mt: 1, backgroundColor: '#ffe1c6' }} />
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

